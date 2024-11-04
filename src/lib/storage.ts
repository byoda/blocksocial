export default class ByoStorage {
    storage: Storage;

    constructor() {
        this.storage = window.localStorage;
    }

    get(key: string): object | undefined {
        let text: string | null = this.storage.getItem(key);
        if (text == undefined) {
            return undefined;
        }
        let data: object = JSON.parse(text);
        return data
    }

    set(key: string, value: object) {
        this.storage.setItem(key, JSON.stringify(value));
    }

    load_subscribed_lists_sync(): Set<string> {
        let key: string = this.get_subscribed_lists_key()
        const parsed = this.get(key)
        let data: Set<string> = parsed as Set<string>
        return data
    }

    save_subscribed_lists_sync(value: Set<string>) {
        let key: string = this.get_subscribed_lists_key()
        this.set(key, Array.from(value.values()))
    }

    private get_subscribed_lists_key(): string {
        return `subscribed_lists`
    }
}