import sys
import json
import os

args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
to = args.get("to", "User")
prefix = os.environ.get("MESSAGE_PREFIX", "Hello")
config_name = os.environ.get("CONFIG_name", "World")

print(f"{prefix}, {to}! (Configured for {config_name}). This is running from the new Skill Architecture.")
