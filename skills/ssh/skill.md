# Skill: SSH Client

This skill provides access to remote servers via SSH. It supports two main modes of operation: automated command execution and interactive persistent sessions.

## Operation Modes

### 1. Interactive Persistence (Default for shell/tunneling)
When you need to keep a connection open (e.g., to run multiple commands based on previous output or to handle a login prompt), you MUST use `ssh_connect`.

- **Action**: `ssh_connect`
- **Behavior**: This action has `onlyBg: true`, so it will always start in the background and return a **Session ID**.
- **Management**:
    - **Reading Output**: Use `skill_instance_read` with the Session ID to see what the terminal is showing (e.g., to see if it's asking for a password).
    - **Sending Input**: Use `skill_instance_write` with the Session ID to send text to the terminal (e.g., typing a password or a command).
    - **Listing Sessions**: Use `skill_instance_ls` to see active background connections.
    - **Closing**: Use `skill_instance_kill` to terminate the connection.

### 2. One-Shot Execution
If the user explicitly asks to run a specific command or list of commands and wait for the result, use `ssh_run`.

- **Action**: `ssh_run`
- **Behavior**: Executes the list of commands and returns the combined output. It closes the connection automatically when done.

## Guidelines for the AI
- **Prefer `ssh_connect`** for general "connect to X" requests unless it's a specific "run command Y" request.
- **Check the state often**: Remote connections can fail or ask for passwords. Use `skill_instance_read` after starting a `ssh_connect` session to verify success.
- **Cleanup**: Don't leave connections open if they are no longer needed. Use `skill_instance_kill` when the task is done.
- **Security**: Never share credentials in plain text unless requested. Use the system vault if passwords/keys are required.
