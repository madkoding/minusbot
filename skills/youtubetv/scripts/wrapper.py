
import sys
import json
import os
import argparse
import socket
from typing import Optional, Dict, Any

# Ensure we can import local modules
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

try:
    from ytv_dial import YouTubeDIALClient, discover_devices, DeviceNotFoundError
    from dial import DIALDevice
except ImportError as e:
    print(json.dumps({"error": f"Failed to import dial modules: {e}"}))
    sys.exit(1)

FAVORITES_FILE = "/data/youtubetv_favorites.json"

def load_favorites() -> Dict[str, Dict[str, Any]]:
    if not os.path.exists(FAVORITES_FILE):
        return {}
    try:
        with open(FAVORITES_FILE, 'r') as f:
            data = json.load(f)
            # Migrate old format {name: ip} to {name: {ip: ip, port: 8008}}
            new_data = {}
            for k, v in data.items():
                if isinstance(v, str):
                    new_data[k] = {"ip": v, "port": 8008}
                else:
                    new_data[k] = v
            return new_data
    except Exception:
        return {}

def save_favorites(favorites: Dict[str, Dict[str, Any]]):
    os.makedirs(os.path.dirname(FAVORITES_FILE), exist_ok=True)
    with open(FAVORITES_FILE, 'w') as f:
        json.dump(favorites, f, indent=2)

def resolve_client(device_arg: Optional[str], port_arg: Optional[int] = None) -> Optional[YouTubeDIALClient]:
    """
    Resolves a device argument to a YouTubeDIALClient.
    """
    favorites = load_favorites()
    
    # CASE 1: No device specified
    if not device_arg:
        # Try to find a default favorite (first one)
        if favorites:
            name, data = next(iter(favorites.items()))
            ip = data.get("ip")
            port = data.get("port", 8008)
            print(f"Using default favorite: {name} ({ip}:{port})", file=sys.stderr)
            return YouTubeDIALClient.from_address(ip, port=int(port))
        
        # Fallback to discovery
        print("No device specified and no favorites found. Scanning...", file=sys.stderr)
        devices = discover_devices(timeout=3)
        if devices:
            return YouTubeDIALClient(devices[0])
        else:
            raise Exception("No devices found on network.")

    # CASE 2: Device is known favorite name
    if device_arg in favorites:
        data = favorites[device_arg]
        ip = data.get("ip")
        port = data.get("port", 8008)
        return YouTubeDIALClient.from_address(ip, port=int(port))

    # CASE 3: Device looks like an IP address
    try:
        socket.inet_aton(device_arg)
        # It is a valid IP
        port = port_arg if port_arg else 8008
        return YouTubeDIALClient.from_address(device_arg, port=int(port))
    except socket.error:
        pass # Not an IP

    # CASE 4: Device is a name but not in favorites -> Scan and match
    print(f"Device '{device_arg}' not in favorites. Scanning...", file=sys.stderr)
    devices = discover_devices(timeout=3)
    for dev in devices:
        if dev.friendly_name == device_arg:
             return YouTubeDIALClient(dev)
    
    # CASE 5: Partial match on scan?
    for dev in devices:
        if device_arg.lower() in dev.friendly_name.lower():
            print(f"Found partial match: {dev.friendly_name}", file=sys.stderr)
            return YouTubeDIALClient(dev)

    raise Exception(f"Device '{device_arg}' not found.")

def handle_discover(**kwargs):
    timeout = kwargs.get("timeout", 5)
    print(f"Scanning for devices (timeout={timeout}s)...", file=sys.stderr)
    devices = discover_devices(timeout=float(timeout))
    results = []
    for d in devices:
        # Try to parse port from app_url if possible, usually 8008
        # app_url example: http://192.168.1.5:8008/apps
        port = 8008
        try:
             port = int(d.app_url.split(":")[2].split("/")[0])
        except:
             pass

        results.append({
            "friendly_name": d.friendly_name,
            "model_name": d.model_name,
            "manufacturer": d.manufacturer,
            "app_url": d.app_url,
            "udn": d.udn,
            "ip": d.app_url.split("//")[1].split(":")[0],
            "port": port
        })
    print(json.dumps(results, indent=2))

def handle_save_favorite(name: str, ip: str, port: int):
    favs = load_favorites()
    favs[name] = {"ip": ip, "port": port}
    save_favorites(favs)
    print(json.dumps({"status": "success", "message": f"Saved favorite '{name}' with IP {ip}:{port}"}))

def handle_list_saved():
    favs = load_favorites()
    results = []
    for name, data in favs.items():
        results.append({"name": name, "ip": data.get("ip"), "port": data.get("port", 8008)})
    print(json.dumps(results, indent=2))

def handle_control(action: str, device_arg: Optional[str], **kwargs):
    port_arg = kwargs.get("port")
    try:
        client = resolve_client(device_arg, port_arg)
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        return

    result = ""
    try:
        if action == "play_video":
            vid = kwargs.get("video_id")
            playlist = kwargs.get("playlist_id")
            if not vid:
                raise ValueError("video_id is required")
            
            if playlist:
                client.launch_playlist(playlist, video_id=vid)
                result = f"Launched playlist {playlist} starting at video {vid}"
            else:
                client.launch_video(vid)
                result = f"Launched video {vid}"

        elif action == "play_playlist":
            playlist = kwargs.get("playlist_id")
            if not playlist:
                raise ValueError("playlist_id is required")
            client.launch_playlist(playlist)
            result = f"Launched playlist {playlist}"

        elif action == "search":
            query = kwargs.get("query")
            if not query:
                raise ValueError("query is required")
            client.launch_search(query)
            result = f"Launched search for '{query}'"

        elif action == "channel":
            channel = kwargs.get("channel_id")
            if not channel:
                raise ValueError("channel_id is required")
            client.launch_channel(channel)
            result = f"Launched channel {channel}"

        elif action == "stop":
            stopped = client.stop()
            result = "Stopped playback" if stopped else "App was not running"

        elif action == "status":
            state = client.get_app_state()
            print(json.dumps({
                "name": state.name,
                "state": state.state,
                "instance_url": state.instance_url,
                "additional_data": state.additional_data
            }, indent=2))
            return

        else:
             print(json.dumps({"status": "error", "message": f"Unknown control action: {action}"}))
             return

        print(json.dumps({"status": "success", "message": result, "device": client.device.friendly_name}))

    except Exception as e:
        print(json.dumps({"status": "error", "message": f"Operation failed: {str(e)}"}))


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        return

    try:
        data = json.loads(sys.argv[1])
    except json.JSONDecodeError:
         print(json.dumps({"error": "Invalid JSON input"}))
         return

    mode = data.get("mode") # discover, save, list, control
    
    if mode == "discover":
        handle_discover(**data)
    elif mode == "save":
        name = data.get("friendly_name")
        ip = data.get("ip")
        port = data.get("port", 8008)
        if not name or not ip:
             print(json.dumps({"error": "friendly_name and ip required for save"}))
             return
        handle_save_favorite(name, ip, int(port))
    elif mode == "list":
        handle_list_saved()
    elif mode == "control":
        action = data.get("action")
        device = data.get("device")
        # Extract other potential args
        video_id = data.get("video_id")
        playlist_id = data.get("playlist_id")
        query = data.get("query")
        channel_id = data.get("channel_id")
        port = data.get("port")
        
        handle_control(
            action, 
            device, 
            video_id=video_id, 
            playlist_id=playlist_id, 
            query=query, 
            channel_id=channel_id,
            port=port
        )
    else:
        print(json.dumps({"error": f"Unknown mode: {mode}"}))

if __name__ == "__main__":
    main()
