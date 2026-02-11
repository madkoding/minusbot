# Minusbot 🤖

Multi-step AI Agent built with Bun, TypeScript, and Docker.

## Setup

1.  **Directories**: The bot uses `~/.config/minusbot` for storage.
2.  **API Key**: Create `~/.config/minusbot/secrets/agent.env` and add:
    ```env
    API_KEY=your_openai_or_compatible_key
    ```
3.  **Settings**: Create `~/.config/minusbot/settings.json`:
    ```json
    {
      "model_id": "gpt-4o",
      "ai_endpoint": "https://api.openai.com/v1"
    }
    ```

## Skills

Skills are located in `~/.config/minusbot/skills/`. Each skill consists of:
- `skill.json`: Tool definition.
- `script.py`: Python logic executed in a disposable Docker container.

### Core Tools
- `skill_list`: List available skills.
- `skill_get`: Get skill schema.
- `skill_run`: Execute a skill.
- `cronjob_add`: Schedule an async task.
- `cronjob_join`: Schedule a sync task (chat blocks until triggered).
- `cronjob_list`: List scheduled tasks.

## Running

```bash
bun start [chat_id]
```

If no `chat_id` is provided, a new "temporal" chat is created. Temporal chats are automatically deleted after 30 days of inactivity.
