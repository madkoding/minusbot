# Minusbot 🤖

**Minusbot** is a modular, multi-user AI Agent platform built with **Bun**, **TypeScript**, and **Docker**. It is designed to be extensible, secure, and easily integrated into various interfaces like Telegram or a Web Dashboard.

## ✨ Features

- **🧠 Multi-Model AI**: Support for OpenAI and compatible endpoints (e.g., LocalAI, vLLM).
- **🔌 Integrations**: Native support for **Telegram** bots and a **Web Dashboard**.
- **🛠️ Dockerized Skills**: Extend capabilities safely by running tools in isolated Docker containers.
- **🔐 Secure Vaults**: Per-user and global encrypted vaults for API keys and secrets.
- **⚡ Reactive Architecture**: Event-driven design with PubSub for real-time updates.
- **👥 Multi-User**: Complete user management with roles (Root, Admin, User).
- **💾 Persistent Memory**: JSON-based storage for chats and configuration.

## 🚀 Quick Start

### ⚡ Automated Installation (Recommended)

The easiest way to get **Minusbot** up and running is using our automated installer script.

```bash
# Run the installer
curl -sSL https://raw.githubusercontent.com/sammwyy/minusbot/main/install.sh | bash
```

This script will:
1.  Check for dependencies (**Git** & **Docker**) and install them if missing.
2.  Clone the repository.
3.  Build the **Docker** container and compile the **Web Dashboard**.
4.  Optionally install default **Skills**.
5.  Generate your initial **Root** credentials.

### 🛠️ Manual Installation (Fallback)

If you prefer to set up manually:

```bash
# Clone
git clone https://github.com/sammwyy/minusbot
cd minusbot

# Install all dependencies (Backend + Frontend)
bun run install:all

# Install default skills
bun run skills:install

# Build and run
bun run build
bun start
```

### 2. Initial Setup via CLI

Once running, interact with the CLI:

1.  **Login/Root**: The CLI interaction acts as the `root` user.
2.  **Set API Key**:
    ```bash
    /env set agent API_KEY sk-your-key-here
    ```
3.  **Validate**:
    ```bash
    /start
    ```
    This command will check your API key, model configuration, and integrations.

## 📚 Documentation

- [**Installation**](docs/install.md): Setup guide for Docker and Local.
- [**Usage & Commands**](docs/usage.md): Full list of slash commands and features.
- [**Skills System**](docs/skills.md): How to create and manage safe AI tools.

## 🤖 Integrations

### Telegram
Minusbot can control a Telegram bot for you.
1.  Get a `BOT_TOKEN` from [@BotFather](https://t.me/BotFather).
2.  Configure it in your user vault:
    ```bash
    /env set integration-telegram BOT_TOKEN <token>
    ```
3.  Link your user:
    Create `~/.config/minusbot/users/<user>/integrations/telegram.json`:
    ```json
    {
      "chat_id": "main",
      "user_id": "YOUR_TELEGRAM_USER_ID"
    }
    ```
    *(Or allow the bot to guide you via the upcoming commands)*.

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **Containerization**: Docker (for Skills)
- **Database**: JSON Filesystem (Simple & Portable)

## 📄 License

MIT
