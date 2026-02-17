# AI Client Development

AI Clients are static code implementations of different API protocols. They are located in `src/ai/clients`.

## Architecture

- **AIClient (Interface)**: Defines the required methods for model listing and chat completions.
- **BaseOpenAI (Class)**: A base implementation for any OpenAI-compatible API.
- **AIRegistry**: Manages the mapping between client IDs (stored in providers) and their code instances.

## Creating a new Client

1. Create a new file in `src/ai/clients/your-client.ts`.
2. Extend `BaseOpenAI` if it's compatible, or implement `AIClient`.
3. Register it in `src/ai/registry.ts`.

Example:
```typescript
import { BaseOpenAI } from "./base-openai";

export class MyCustomClient extends BaseOpenAI {
    public override id = "my-custom";
    public override name = "My Custom Service";
    
    constructor() {
        super("https://api.mycustom.com/v1");
    }
}
```

## Supported Types

Clients should declare which `AIProviderType` they support. The UI will filter them accordingly.
- `text`
- `vision`
- `image`
- `tts`
- `stt`
