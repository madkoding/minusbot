import { EventEmitter } from "events";

class PubSubManager extends EventEmitter {
    publish(channel: string, data: any) {
        this.emit(channel, data);
    }

    subscribe(channel: string, listener: (data: any) => void) {
        this.on(channel, listener);
    }

    unsubscribe(channel: string, listener: (data: any) => void) {
        this.off(channel, listener);
    }
}

export const PubSub = new PubSubManager();
