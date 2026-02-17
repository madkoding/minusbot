# 🔍 SerpApi Integration

Minusbot can use Google Search capabilities via SerpApi to answer complex questions or fetch real-time information.

## 🔑 Prerequisites

1.  A valid [SerpApi Account](https://serpapi.com/).

## ⚙️ Configuration

1.  **API Key**: Obtain your API Key from the SerpApi Dashboard.
2.  **Configure Minusbot**:
    Use the `/env` command (or the Web Dashboard) to save your API Key.
    ```bash
    /env set integration-serpapi API_KEY <your-api-key>
    ```

## 🛠️ Usage

The AI agent will automatically use the Google Search tool when it needs to find information on the web.
-   Example: "Who won the World Cup in 2022?" -> AI uses `google_search` -> SerpApi.
-   Example: "Latest news on AI development" -> AI uses `google_search`.

## 🎛️ Advanced Settings

You can configure search behavior (e.g., location, language) in your user settings:
-   `serpapi_location`: Default location for search queries (e.g. "Argentina").
-   `serpapi_lang`: Default language (e.g. "es").
