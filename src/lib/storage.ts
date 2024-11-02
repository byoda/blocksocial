export default class ByoStorage {
    storage: Storage;

    constructor() {
        this.storage = window.localStorage;
    }

    get_sync(key: string): object | undefined {
        let text: string | null = this.storage.getItem(key);
        if (text == undefined) {
            return undefined;
        }
        let data: object = JSON.parse(text);
        return data
    }

    set_sync(key: string, value: object) {
        this.storage.setItem(key, JSON.stringify(value));
    }

    async get(key: string): Promise<object | undefined> {
        let text: string | null = this.storage.getItem(key);
        if (text == undefined) {
            return undefined;
        }
        let data: object = JSON.parse(text);
        return data
    }

    load_subscribed_lists_sync(): Set<string> {
        let key: string = `subscribed_lists`;
        const parsed = this.get_sync(key);
        let data: Set<string> = parsed as Set<string>;
            return data
    }

    save_subscribed_lists_sync(value: Set<string>) {
        let key: string = `subscribed_lists`;
        this.set_sync(key, Array.from(value.values()))
    }
}