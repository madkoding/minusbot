import { expect, test, describe, spyOn, mock, afterEach } from "bun:test";

import { Updater } from "@/updater";

// Mock dependencies directly
mock.module("@/data/storage", () => ({
    getSystemSettings: () => Promise.resolve({
        updater_channel: "stable",
        updater_stable_url: "http://example.com/updates",
        updater_nightly_url: "http://example.com/nightly"
    }),
    SYSTEM_SETTINGS_FILE: "/tmp/settings.json"
}));

mock.module("@/cli/colors", () => ({
    Logger: {
        info: mock(),
        error: mock()
    }
}));



const originalFetch = global.fetch;

describe("Updater", () => {
    // Clean up fetch mock
    afterEach(() => {
        global.fetch = originalFetch;
    });

    test("should fetch updates", async () => {
        // Mock fetch response
        const mockFetch = mock(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
                { version: "1.0.1", changes: [], name: "v1.0.1" },
                { version: "0.9.0", changes: [], name: "v0.9.0" }
            ])
        } as any));
        global.fetch = mockFetch as any;


        Updater.getCurrentVersion = mock(() => Promise.resolve("1.0.0"));

        const result = await Updater.checkUpdates();

        expect(result.updates.length).toBe(1);
        expect(result.updates[0]?.version).toBe("1.0.1");
    });

    test("should handle fetch errors", async () => {
        const mockFetch = mock(() => Promise.resolve({
            ok: false
        } as any));
        global.fetch = mockFetch as any;

        await expect(Updater.checkUpdates()).rejects.toThrow("Failed to fetch updates");
    });
});
