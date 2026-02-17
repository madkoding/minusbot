import { expect, test, describe, spyOn, mock } from "bun:test";

import { Logger } from "@/cli/colors";

// Mock storage to control colors setting
mock.module("@/data/storage", () => ({
    getGlobalSettings: mock(() => Promise.resolve({ colors: false })),
}));

describe("Logger", () => {
    test("should log info message", async () => {
        const consoleSpy = spyOn(console, "log").mockImplementation(() => { });
        await Logger.info("Test message");

        expect(consoleSpy).toHaveBeenCalled();
        const output = consoleSpy.mock.calls[0]?.[0];

        expect(output).toContain("INFO");
        expect(output).toContain("Test message");

        consoleSpy.mockRestore();
    });

    test("should log error message", async () => {
        const consoleSpy = spyOn(console, "log").mockImplementation(() => { });
        await Logger.error("Error occurred");

        expect(consoleSpy).toHaveBeenCalled();
        const output = consoleSpy.mock.calls[0]?.[0];
        expect(output).toContain("CRIT");
        expect(output).toContain("Error occurred");

        consoleSpy.mockRestore();
    });
});
