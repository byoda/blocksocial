import type { iListOfLists } from "./datatypes";

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

    load_list_of_lists_sync(): iListOfLists {
        let key: string = `LoL`;
        const parsed = this.get_sync(key);
        if (this.isListOfLists(parsed)) {
            let data: iListOfLists = parsed as iListOfLists;
            return data
        };

        return { lists: [] };
    }

    save_list_of_lists_sync(value: iListOfLists) {
        let key: string = `LoL`;
        this.set_sync(key, value);
    }

    isListOfLists(obj: any): obj is iListOfLists {
        // console.log('Got list of lists:', JSON.stringify(obj));
        if (obj === undefined) {
            return false;
        }
        return obj.lists !== undefined;
    }

    isList(obj: any): obj is Set<string> {
        return obj instanceof Set;
    }
}