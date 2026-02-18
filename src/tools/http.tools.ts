import { toolManager } from "./tools";

toolManager.registerTool(
    {
        type: "function",
        function: {
            name: "http_request",
            description: "Make an HTTP request (GET, POST, etc.) to any URL.",
            parameters: {
                type: "object",
                properties: {
                    method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"], default: "GET" },
                    url: { type: "string", description: "The URL to request" },
                    headers: { type: "object", description: "Request headers" },
                    body: { type: "string", description: "Request body (for POST/PUT)" }
                },
                required: ["url"]
            }
        }
    },
    async (args) => {
        try {
            const response = await fetch(args.url, {
                method: args.method || "GET",
                headers: args.headers || {},
                body: args.body
            });

            const status = response.status;
            const headers = Object.fromEntries(response.headers.entries());
            let data: string;

            const contentType = response.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                data = await response.json().then(j => JSON.stringify(j, null, 2));
            } else {
                data = await response.text();
            }

            return JSON.stringify({ status, headers, data });
        } catch (e: any) {
            return `Error: ${e.message}`;
        }
    }
);
