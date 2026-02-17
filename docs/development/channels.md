# 📡 Developing Channels

Channels are the communication mediums through which users interact with Minusbot. Examples include Telegram, Discord, and the Web Interface.

## 🏗️ Structure of a Channel

All channels must extend the `Channel` abstract class defined in `src/channels/channel-base.ts`.

```typescript
import { Channel, ChannelSchema } from "../channel-base";

export class MyChannel extends Channel {
    readonly id = "my-channel";
    readonly name = "My Channel";
    readonly description = "Integration with My Service";
    
    readonly schema: ChannelSchema = {
        id: "my-channel",
        name: "My Channel",
        description: "Integration with My Service",
        fields: [
            {
                id: "api_key",
                label: "API Key",
                type: "string",
                secret: true
            }
        ]
    };

    async start() {
        // Initialize connection here
        const apiKey = await this.getSecrets();
        // ...
    }

    async stop() {
        // Cleanup connection here
    }

    async sendFile(filePath: string, filename?: string) {
        // Implement file sending logic
    }
}
```

## ⚙️ Configuration Schema

The `schema` property defines what configuration the channel needs from the user.
-  `fields`: Array of fields (strings, numbers, booleans) that the user must provide.
-  `vaultKeys`: Keys that should be stored securely in the Vault (not in plain text config).

## 🔐 Secrets Management

Channels can access secure secrets using `this.getSecrets()`. This merges:
1.  Global Admin secrets for the channel (if any).
2.  User-specific overrides (if configured).

## 📥 Handling Messages

To process incoming messages, use the `InputProcessor`:

```typescript
import { InputProcessor } from "../../processor";

// Inside your message handler
const result = await InputProcessor.process({
    id: messageId,
    content: messageText,
    role: "user",
    metadata: {
        channel: this.id,
        chat_id: chatId,
        user_id: this.user.id
    }
});
```
