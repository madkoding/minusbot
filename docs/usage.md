# 📖 Usage Guide

Minusbot is controlled via slash commands within the terminal. Any message starting with `/` is treated as a command.

## 🛠️ Configuration & Environment

### `/env`
Manage secrets and API keys stored in encrypted vaults.
*   `list <vault>`: List keys in a specific vault.
*   `set <vault> <key> <value>`: Set a secret.
*   **Example**: `/env set agent API_KEY sk-xxxx...`

### `/settings`
Configure bot behavior and preferences.
*   `list`: View all current settings.
*   `set <key> <value>`: Update a setting.
*   **Keys**: `model_id`, `ai_endpoint`, `colors`.

---

## 📅 Task Management (Cron)

### `/cron`
Manage scheduled AI tasks.
*   `list`: Show all pending cronjobs.
*   `cancel <id>`: Stop a scheduled task.
*   **Autonomous Use**: The AI can also schedule tasks using tools like `cronjob_add`.

---

## 󰚚 Skills

### `/skills`
Interact with external AI skills (Dockerized modules).
*   `list`: List all installed skills in your system.
*   `info <id>`: Get detailed information about a skill's inputs and description.

---

## 💬 Chat Management

### `/chats`
Manage conversation history.
*   `list`: List all saved chat sessions.
*   `delete <id>`: Physically remove a chat folder.
*   `history <id>`: Quick overview of a chat's last messages.

---

## 📊 Analytics

### `/stats`
View bot usage and performance metrics.
*   `[date (YYYY-MM-DD)]`: View stats for a specific day or leave blank for total lifetime stats.
*   **Tracked**: Chats created, messages sent, input/output tokens.

---

## ❓ Assistance

### `/help`
Get help with commands.
*   `[command]`: View specific usage and description for a command.
*   **Example**: `/help cron`
