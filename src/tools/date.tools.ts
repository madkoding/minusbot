import { toolManager } from "./tools";

toolManager.registerTool({
    type: "function",
    function: {
        name: "date_now",
        description: "Get the current date and time in ISO format.",
        parameters: {
            type: "object",
            properties: {}
        }
    }
}, async () => {
    return new Date().toISOString();
});

toolManager.registerTool({
    type: "function",
    function: {
        name: "date_future",
        description: "Get a future date ISO string adding time to current date. Format: 'D:H:M:S' (Days:Hours:Minutes:Seconds). You can omit parts from the left (e.g. '30' = 30s, '10:00' = 10m, '1:30:00' = 1h30m).",
        parameters: {
            type: "object",
            properties: {
                time: {
                    type: "string",
                    description: "Time to add. Format: '[[D:]H:]M:S' (e.g. '1:00:00:00', '1:00:00', '10:30', '45')."
                }
            },
            required: ["time"]
        }
    }
}, async ({ time }: { time: string }) => {
    const parts = time.split(":").map(p => parseInt(p.trim()));

    if (parts.some(isNaN)) {
        return "Error: Invalid time format. Use numbers separated by colons (e.g. 1:30:00 or 15).";
    }

    let days = 0, hours = 0, minutes = 0, seconds = 0;

    if (parts.length === 1) {
        seconds = parts[0] as number;
    } else if (parts.length === 2) {
        minutes = parts[0] as number;
        seconds = parts[1] as number;
    } else if (parts.length === 3) {
        hours = parts[0] as number;
        minutes = parts[1] as number;
        seconds = parts[2] as number;
    } else if (parts.length === 4) {
        days = parts[0] as number;
        hours = parts[1] as number;
        minutes = parts[2] as number;
        seconds = parts[3] as number;
    } else {
        return "Error: Invalid format. Use 'D:H:M:S', 'H:M:S', 'M:S' or 'S'.";
    }

    const future = new Date();
    future.setDate(future.getDate() + days);
    future.setHours(future.getHours() + hours);
    future.setMinutes(future.getMinutes() + minutes);
    future.setSeconds(future.getSeconds() + seconds);

    return future.toISOString();
});
