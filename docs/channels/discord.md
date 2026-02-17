# 🎮 Discord Channel

Minusbot can act as a fully functional Discord Bot, complete with Slash Commands and rich responses.

## 🔑 Prerequisites

1.  A Discord account.
2.  A Discord Bot Application (create in [Discord Developer Portal](https://discord.com/developers/applications)).
3.  Permissions: **Run Slash Commands**, **Send Messages**, **Read Messages/View Channels**, **Attach Files**.
4.  Privileged Gateway Intents: **Message Content Intent**.

## ⚙️ Configuration

1.  **Create Bot**: Go to Discord Developer Portal > Applications > New Application.
2.  **Get Token**: Go to "Bot" tab > "Reset Token" > Copy Token.
3.  **Configure Minusbot**:
    Use the `/env` command (or the Web Dashboard) to save your token.
    ```bash
    /env set channel-discord TOKEN <your-token>
    ```

## 🔗 Authorizing Your Bot

1.  Go to "OAuth2" > "URL Generator".
2.  Select `bot` and `applications.commands`.
3.  Select permissions: `Administrator` (easiest) or specific permissions.
4.  Copy the generated URL and open it in your browser.
5.  Authorize the bot to your server.

## 🤖 Usage

-   Use `/` in Discord to see available Slash Commands.
-   Mention the bot `@Minusbot` to chat directly in channels.
-   The bot will automatically sync its commands on startup.
