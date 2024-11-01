// all interfaces and classes related to a BYOMod list

import * as yaml from 'js-yaml';

import type {
    iByoList, iBlockEntry, iSocialAccount, iByoListCategory
} from './datatypes';

import HandleStore from '../lib/handle_store/handle_store'

import ByoStorage from './storage';
import BlockEntry from './blockentry';

export default class ByoList {
    storage: ByoStorage;
    download_url: URL
    list: iByoList | undefined
    author_name: string | undefined
    author_email: string | undefined
    author_url: string | undefined
    list_name: string | undefined
    last_updated: Date | undefined
    categories: Map<string, string> | undefined
    block_entries: BlockEntry[] = []

    constructor(url: string | URL) {
        this.storage = new ByoStorage();

        if (typeof url === 'string') {
            this.download_url = new URL(url);
        } else {
            this.download_url = url;
        }
    }

    async initialize(max_age: number = 0): Promise<boolean> {
        /*
        Initialize the list by loading from storage if possible and
        according to 'max_age', it has not expired or downloading and
        saving otherwise.

        If max_age == 0, always download and save the list.

        Returns true if the list was loaded or downloaded successfully.
        */

        let list_data: iByoList

        if (max_age != 0) {
            try {
                list_data = await this.load();
            } catch (e) {
                console.log(`Could not load from storage: ${this.download_url.href}`);
            }
        }
        try {
            list_data = await this.download();
            await this.save(list_data)
        } catch (e) {
            console.error('Could not download: ', this.download_url.href, e)
            return false
        }
        this.list = list_data
        this.convert_categories(list_data.meta.categories)
        this.convert_block_entries(list_data.block_list)

        return true;
    }

    get_keyname(key: string): string {
        return `${key}`;
    }

    async load(): Promise<iByoList> {
        /**
        Load the list from storage
        **/

        let key: string = this.get_keyname(`list_${this.download_url.href}`);
        let list_data: iByoList = await this.storage.get(key) as iByoList;

            if (list_data === undefined) {
                console.log(`No data in storage for list ${this.download_url.href}`);
                return list_data;
            }
        return list_data
    }

    async save(list: iByoList | undefined = undefined): Promise<void> {
        if (list === undefined) {
            if (this.list === undefined) {
                throw new Error('No list to save')
            }
            list = this.list;
        }
        let key: string = this.get_keyname(`list_${this.download_url.href}`);
        console.log(`Saving list to: ${key}`);

        this.storage.set_sync(key, list);
    }

    async download(): Promise<iByoList> {
        let response: Response = await fetch(this.download_url.href);
        if (response.status === 200) {
            let text: string = await response.text();
            let list_data: iByoList = yaml.load(text) as iByoList;
            console.log(
                'Downloaded list:', this.download_url.href, 'with',
                list_data.block_list.length, 'entries'
            );
            return list_data
        }

        console.log(`Failed to download list:', ${this.download_url.href}`);
        throw new Error('Failed to download list');
    }

    private convert_block_entries(block_list: iBlockEntry[]) {
        for (let entry of block_list) {
            let block_entry: BlockEntry = new BlockEntry(entry);
            this.block_entries.push(block_entry);
        }
    }
    
    private convert_categories(category_data: Object) {
        if (category_data === undefined) {
            this.categories = new Map<string, string>()
            return
        }
        if (this.categories === undefined) {
            this.categories = new Map<string, string>()
        }
        for (let [name, description] of Object.entries(category_data)) {
            this.categories.set(name, description)
        }
    }

    get_accounts_by_platform(platform: string): iSocialAccount[] {
        if (this.list === undefined || this.list.block_list === undefined) {
            return []
        }
        let accounts: iSocialAccount[] = [];
        for (let block_entry of this.block_entries) {
            if (! block_entry.social_accounts.has(platform)) {
                continue
            }
            for (let social_account of block_entry.social_accounts.get(platform)!) {
                accounts.push(social_account);
            }
        }
        return accounts
    }

    async store_social_accounts(handle_store: HandleStore, platform: string) {
        let accounts: iSocialAccount[] = this.get_accounts_by_platform(platform)
        for (let account of accounts) {
            handle_store.add(account.handle, platform)
        }
    }

    // Used for test purposes
    // from_file(filename: string): number {
    //     let text: string = fs.readFileSync(filename, 'utf8');
    //     let data: iByoList = yaml.load(text) as iByoList ;
    //     this.list = data;
    //     return this.list.block_list.length;
    // }
}
