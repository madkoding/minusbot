# 󰚚 AI Skills System

Minusbot features a modular **Skills System** that allows it to execute complex tasks in isolated environments using Docker.

## 🧱 What is a Skill?

A skill is a self-contained folder containing:
1.  **`skill.json`**: The metadata and definition that the AI understands.
2.  **Code**: Usually Python scripts or compiled binaries.
3.  **Docker Environment**: Skills run inside short-lived Docker containers to ensure security and dependency isolation.

## 📄 `skill.json` Structure

Every skill must have a `skill.json` file. Here is an example:

```json
{
  "id": "weather",
  "displayName": "Weather Explorer",
  "description": "Get current weather for any city",
  "vaultKeys": ["API_KEY"],
  "dockerImage": "python:3.11-slim",
  "enableNetwork": true,
  "configSchema": {
    "type": "object",
    "properties": {
      "default_unit": {
        "type": "string",
        "description": "Default temperature unit (c or f)",
        "default": "c"
      }
    }
  },
  "actions": [
    {
      "name": "get_weather",
      "description": "Get current weather for a city",
      "parameters": {
        "type": "object",
        "properties": {
          "city": { 
            "type": "string",
            "description": "City name"
          },
          "unit": { 
            "type": "string", 
            "enum": ["c", "f"],
            "description": "Temperature unit"
          }
        },
        "required": ["city"]
      },
      "_script": "weather.py"
    }
  ]
}
```

-   **id**: Unique identifier for the skill.
-   **displayName**: Human-readable name.
-   **description**: What the skill does.
-   **vaultKeys**: Secret keys stored in the vault (e.g., API keys).
-   **configSchema**: User-configurable options with defaults.
-   **dockerImage**: The Docker image to use as a base.
-   **enableNetwork**: Whether the skill needs network access.
-   **actions**: Array of actions the skill can perform, each with:
    -   **name**: Action identifier.
    -   **description**: What the action does.
    -   **parameters**: JSON Schema for the action's inputs.
    -   **_script**: The script file to execute (relative to `scripts/` folder).

## 🛠️ How it Works

1.  **Selection**: The AI decides it needs to use a skill based on its description.
2.  **Mapping**: Minusbot maps the skill folder as **read-only** into a fresh Docker container.
3.  **Execution**: The container starts, executes the `entrypoint`, and pipes the output back to the AI.
4.  **Cleanup**: The container is destroyed immediately after execution.

## 📥 Installing Skills

Skills are stored in `~/.config/minusbot/skills/`. You can:
1.  Copy skill folders manually there.
2.  Use the build-in installer if you are in the repo:
    ```bash
    bun run skills:install
    ```

## 🔒 Security

*   **Isolated**: Skills cannot access your host filesystem (except for their own folder).
*   **Read-Only**: Skills cannot modify their own source code.
*   **No Network (Optional)**: Network access can be restricted via settings.
