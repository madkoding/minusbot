import { expect, test, describe, beforeAll, afterAll, mock } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("User Manager Integration", () => {
    let TMP_DIR: string;
    let UserManager: any;

    // Setup before all tests
    beforeAll(async () => {
        // 1. Create temp directory
        TMP_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "minusbot-users-test-"));

        // 2. Set environment variable BEFORE importing modules
        process.env.MINUSBOT_HOME = TMP_DIR;

        // 3. Mock Logger to avoid circular dependencies
        mock.module("../../src/cli/colors", () => ({
            Logger: {
                info: async (text: string) => { /* silent */ },
                warn: async (text: string) => { /* silent */ },
                error: async (text: string) => { /* silent */ },
            }
        }));

        // 4. Clear module cache to force re-evaluation
        const usersPath = path.resolve(import.meta.dir, "../../src/data/users.ts");
        const storagePath = path.resolve(import.meta.dir, "../../src/data/storage.ts");

        // Force module reload by using dynamic import with cache busting
        const timestamp = Date.now();
        const usersModule = await import(`../../src/data/users.ts?t=${timestamp}`);
        UserManager = usersModule.UserManager;
    });

    // Clean up after all tests
    afterAll(async () => {
        if (TMP_DIR) {
            await fs.rm(TMP_DIR, { recursive: true, force: true });
        }
    });

    test("should initialize and create root user", async () => {
        await UserManager.init();
        const root = UserManager.getUserById("root");
        expect(root).toBeDefined();
        expect(root?.username).toBe("root");
        expect(root?.role).toBe("root");
    });

    test("should create a new user", async () => {
        const user = await UserManager.createUser("testuser", "password123", "user");
        expect(user).toBeDefined();
        expect(user.username).toBe("testuser");
        expect(user.role).toBe("user");
        expect(user.passwordHash).not.toBe("password123"); // Hashed

        // Verify persistence
        const found = UserManager.getUserByUsername("testuser");
        expect(found?.id).toBe(user.id);
    });

    test("should prevent duplicate usernames", async () => {
        await expect(UserManager.createUser("testuser", "pwd", "user"))
            .rejects.toThrow("User already exists");
    });

    test("should update user details", async () => {
        const user = UserManager.getUserByUsername("testuser");
        expect(user).toBeDefined();

        await UserManager.updateUser(user!.id, { username: "updateduser", role: "admin" });

        const updated = UserManager.getUserById(user!.id);
        expect(updated?.username).toBe("updateduser");
        expect(updated?.role).toBe("admin");
    });

    test("should delete user", async () => {
        const user = UserManager.getUserByUsername("updateduser");
        expect(user).toBeDefined();

        await UserManager.deleteUser(user!.id);

        const deleted = UserManager.getUserById(user!.id);
        expect(deleted).toBeUndefined();
    });

    test("should not allow deleting root", async () => {
        await expect(UserManager.deleteUser("root")).rejects.toThrow("Cannot delete root user");
    });
});
