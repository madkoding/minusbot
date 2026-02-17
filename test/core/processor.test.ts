import { expect, test, describe, spyOn, mock, afterEach } from "bun:test";

import { InputProcessor } from "@/processor";
import { UserManager } from "@/data/users";
import { Storage } from "@/data/storage";
import { commandManager } from "@/commands";
import { PubSub } from "@/pubsub";

// Mock dependencies
mock.module("@/data/users", () => ({
    UserManager: {
        getUserById: mock()
    }
}));

mock.module("@/data/storage", () => ({
    Storage: {
        getChat: mock(),
        saveChat: mock()
    }
}));

mock.module("@/commands", () => ({
    commandManager: {
        handle: mock()
    }
}));

mock.module("@/pubsub", () => ({
    PubSub: {
        publish: mock()
    }
}));

describe("InputProcessor", () => {
    test("should throw for invalid user", async () => {
        const userMock = UserManager.getUserById as any;
        userMock.mockReturnValue(null);

        await expect(InputProcessor.process("hello", "uid", "cid")).rejects.toThrow("User not found");
    });

    test("should process commands", async () => {
        const userMock = UserManager.getUserById as any;
        userMock.mockReturnValue({ id: "uid" });

        const storageMock = Storage.getChat as any;
        storageMock.mockResolvedValue({ meta: {}, messages: [] });

        const cmdMock = commandManager.handle as any;
        cmdMock.mockResolvedValue("Command Executed");

        const result = await InputProcessor.process("/test", "uid", "cid");

        expect(result).toBe("Command Executed");
        expect(cmdMock).toHaveBeenCalled();
        expect(PubSub.publish).toHaveBeenCalledTimes(2); // user msg + command result
    });
});
