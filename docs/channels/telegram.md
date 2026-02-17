# ✈️ Telegram Channel

Minusbot can act as a Telegram Bot, allowing you to interact with your agent on the go.

## 🔑 Prerequisites

1.  A Telegram account.
2.  A Telegram Bot Token (obtained from [@BotFather](https://t.me/BotFather)).

## ⚙️ Configuration

1.  **Obtain Token**: Talk to BotFather, create a new bot, and get the HTTP API Token.
2.  **Configure Minusbot**:
    Use the `/env` command (or the Web Dashboard) to save your token.
    ```bash
    /env set channel-telegram TOKEN <your-token>
    ```

## 🔗 Linking Your Account

Once the bot is started, it needs to know which Telegram user corresponds to which Minusbot user.

1.  Start a chat with your bot.
2.  Send `/start`.
3.  The bot should greet you if everything is configured correctly.
4.  If the bot is restricted to specific users, you might need to add your Telegram ID to the whitelist or configure `user_id` mapping.

Currently, the Telegram channel maps users automatically if `allow_new_users` is enabled, or requires manual `user_id` mapping in the user's settings.
