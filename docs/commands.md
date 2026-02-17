# 📖 Commands Reference

Minusbot is primarily controlled via slash commands. The bot supports multiple interfaces (CLI, Telegram, Web), but the core logic remains the same.

Any message starting with `/` is treated as a command.

---

## 🛠️ Configuration & Secrets

### `/env`
Manage your personal API keys and secrets in encrypted vaults.
*   `list <vault>`: Show secrets in a vault.
*   `set <vault> <key> <value>`: Save a secret.
*   `del <vault> <key>`: Remove a secret.
*   **Example**: `/env set agent API_KEY sk-proj-xxxx...`

### `/settings`
Configure personal AI behavior and preferences.
*   `list`: View your current settings (model, endpoint, etc.).
*   `set <key> <value>`: Override a global setting.
*   **Keys**: `model_id` (e.g. gpt-4o), `ai_endpoint`, `colors`.

---

## 🤖 Bot Management

### `/start`
Perform a full system check. Validates:
1.  **API Key**: Ensures your `agent` vault has a valid key.
2.  **Model Availability**: Checks if the AI endpoint responds and has your model.
3.  **Integrations**: Verifies Telegram or other configured accounts.

### `/clear`
Instantaneously wipe the current conversation history to start fresh.
*   **Note**: This is irreversible for the current session.

### `/help`
Display a list of all available commands and their descriptions.

---

## 📅 Task Automation

### `/cron`
Manage scheduled AI tasks.
*   `list`: Show pending/active cronjobs.
*   `cancel <id>`: Stop a specific task.
*   **Autonomous Use**: The AI can self-schedule tasks using tools like `cronjob_add` (e.g., "Remind me in 10 minutes to verify deploy").

---

## 󰚚 Skills

### `/skills`
Control which AI capabilities are active for your user.
*   `list`: Show all installed skills and their status (enabled/disabled).
*   `toggle <id>`: Enable or disable a specific skill for yourself.

---

## 📊 Analytics

### `/stats`
View personal usage metrics.
*   `[date (YYYY-MM-DD)]`: Filter by date (optional).
*   **Metrics**: Chats created, messages exchanged, tokens consumed.

---

## 👥 User Management (Admin Only)

### `/users`
Manage accounts on the bot instance.
*   `list`: Show all registered users.
*   `add <username> <password>`: Create a new user.
*   `passwd <username> <new_password>`: Reset a user's password.
*   `role <username> <role>`: Change permissions (user, admin, root).
*   `remove <username>`: Delete a user and their data.

### `/genv` & `/gsettings` & `/gstats`
Global versions of user commands for system-wide configuration.
*   **Admins** can set default API keys or models for all users.
*   **Example**: `/genv set agent API_KEY sk-global-key...` (Users without a key will use this one).

---

## 📡 Channels & Integrations

For configuration of specific channels (Telegram, Discord, Web) and external integrations (Google Search, etc.), please refer to the specific documentation in `docs/channels/` and `docs/integrations/`.
