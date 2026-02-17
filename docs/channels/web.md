# 🌐 Web Channel

Minusbot is designed to be accessible via any web browser, allowing seamless interaction on desktop and mobile devices inside your LAN network or VPN.

## ⚙️ Configuration

The Web Channel is enabled by default and requires no external tokens or API keys.

1.  **Access**: Navigate to `http://localhost:5173` (or the IP address of your server).
2.  **Configuration**: Settings are managed via the web interface.
3.  **Port**: Defaults to `5173`. Make sure this port is open on your firewall if accessing remotely.

Wait, `port` might be different for backend (`9753`). Frontend `5173` (Vite dev).
For production, user would access via `http://<server-ip>:<web-port>`.

If running locally:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:9753/api`

## 🔒 Security

-   Ensure your server is secured if exposing to public internet (VPN recommended).
-   Authentication is required to access the dashboard.
-   HTTPS is strongly recommended for production deployments.
