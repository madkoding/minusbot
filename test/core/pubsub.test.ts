import { expect, test, describe, mock } from "bun:test";

import { PubSub } from "@/pubsub";

describe("PubSub Manager", () => {
    test("should subscribe and receive messages", () => {
        const channel = "test-channel";
        const message: any = { data: "hello" };
        let received = null;

        PubSub.subscribe(channel, (data) => {
            received = data;
        });

        PubSub.publish(channel, message);
        expect(received).toEqual(message);
    });

    test("should unsubscribe from messages", () => {
        const channel = "test-channel-2";
        const fn = mock();

        PubSub.subscribe(channel, fn);
        PubSub.unsubscribe(channel, fn);
        PubSub.publish(channel, "message");

        expect(fn).not.toHaveBeenCalled();
    });

    test("should handle multiple listeners", () => {
        const channel = "broadcast";
        let count = 0;

        PubSub.subscribe(channel, () => count++);
        PubSub.subscribe(channel, () => count++);

        PubSub.publish(channel, {});
        expect(count).toBe(2);
    });
});
