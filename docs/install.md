# 📥 Installation Guide

This guide will help you get **Minusbot** up and running using Docker or simply with Bun for development/local use.

## 📋 Prerequisites

- **Bun** (Required, unless using Docker only) - `curl -fsSL https://bun.sh/install | bash`
- **Docker** (Recommended for Skills) - Get it from [docker.com](https://docs.docker.com/get-docker/).
- **Git** (Required for cloning).

## 🚀 Getting Started

### ⚡ Automated Installation (Recommended)

The quickest way to install Minusbot is using our installation script:

```bash
curl -sSL https://raw.githubusercontent.com/minusbot-org/minusbot/main/install.sh | bash
```

### 🛠 Manual Installation

If you prefer to set up the environment manually:

### 1. Clone the repository

```bash
git clone https://github.com/minusbot-org/minusbot
cd minusbot
```

### 2. Install dependencies & Skills

Before running, you should install all dependencies and fetch the default AI skills.

```bash
# Install everything (Backend + Frontend)
bun run install:all

# Fetch default skills
bun run skills:install
```

### 3. Run the Bot

```bash
# Development Mode
bun run dev

# Production
bun start
```

### 4. Post-Installation Setup

Once the bot starts, follow the on-screen prompts or use slash commands.

1.  **Login**: Use the default `root` account via CLI.
2.  **API Key**: Configure your AI provider (OpenAI, Anthropic, or compatible local LLM).
    ```bash
    /env set agent API_KEY sk-your-api-key
    ```
3.  **Validate**: Run `/start` to verify everything is working.

## 🐳 Running with Docker

You can containerize the entire bot for deployment.

1.  **Build**:
    ```bash
    docker build -t minusbot .
    ```

2.  **Run**:
    Required mounts:
    - `/var/run/docker.sock`: To spawn skill containers.
    - `~/.config/minusbot`: For persistent storage (users, chats, config).

    ```bash
    docker run -d \
      --name minusbot \
      --restart unless-stopped \
      -p 9753:9753 \
      -v /var/run/docker.sock:/var/run/docker.sock \
      -v $HOME/.config/minusbot:/root/.config/minusbot \
      minusbot
    ```

    > **Note**: Skills access the host Docker socket, giving them capability to launch containers. Ensure you trust the skills you install.

## 🛠 Manual Configuration (Optional)

You can manually edit config files in `~/.config/minusbot`:

- `system-settings.json`: Port configuration.
- `global-settings.json`: Default model ID and endpoint.
- `users/<user>/user-settings.json`: User-specific overrides.
