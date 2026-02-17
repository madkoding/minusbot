# AI Providers

AI Providers allow you to connect Minusbot to different LLM services (like OpenAI, OpenRouter, or custom compatible APIs).

## Provider Types

A provider can be assigned to one of the following tasks:
- **Text**: Main chat and reasoning.
- **Vision**: Analyzing images and screen content.
- **Image**: Generating images (DALL-E).
- **TTS**: Text-to-Speech.
- **STT**: Speech-to-Text.

## Configuration

When adding a provider, you need to specify:
- **Client Protocol**: The API standard to use (e.g., OpenAI compatible).
- **API Key**: Your secret token for the service.
- **Model ID**: The specific model name (e.g., `gpt-4o`, `claude-3-opus`).
- **Config**: Optional settings like Max Tokens and Temperature.

## Global vs. Personal Providers

- **Global Providers**: Created by administrators (root role). Visible and usable by all users as fallback.
- **Personal Providers**: Created by you. Private and only usable by your account.

## Activating Providers

You can have multiple providers for the same type (e.g., two text providers), but only one can be **active** at a time for each type. Activating a new one will automatically deactivate the previous one.
