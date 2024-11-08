// all interfaces and classes related to a BYOMod list

import * as yaml from 'js-yaml';

import {PlatformAccountStatus, SocialAccountStoredStatus, type IBlockList, type iBlockEntry, type iSocialAccount} from './datatypes';

import HandleStore from '../lib/handle_store/handle_store'

import ByoStorage from './storage';
import BlockEntry from './blockentry';

export default class BlockList {
    /*
    A list that user may or may not be subscribed to.
    */
    storage: ByoStorage;
    download_url: URL
    list: IBlockList | undefined
    author_name: string | undefined
    author_email: string | undefined
    author_url: string | undefined
    list_name: string | undefined
    last_updated: Date | undefined
    categories: Map<string, string> | undefined
    block_entries: BlockEntry[] = []
    subscribed: boolean = false

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

        let list_data: IBlockList

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


    async load(): Promise<IBlockList> {
        /**
        Load the list from storage
        **/

        let key: string = this.get_keyname(this.download_url.href);
        let list_data: IBlockList = this.storage.get(key) as IBlockList;

            if (list_data === undefined) {
                console.log(
                    `No data in storage with key ${key} for list ${this.download_url.href}`
                )
            }

            return list_data
    }

    async save(list: IBlockList | undefined = undefined): Promise<void> {
        if (list === undefined) {
            if (this.list === undefined) {
                throw new Error('No list to save')
            }
            list = this.list;
        }
        let key: string = this.get_keyname(this.download_url.href);
        console.log(`Saving list under key: ${key}`);

        this.storage.set(key, list);
    }

    get_accounts_by_platform(platform: string): iSocialAccount[] {
        let accounts: iSocialAccount[] = [];

        let block_entry: BlockEntry
        for (block_entry of this.block_entries || []) {
            if (! block_entry.social_accounts?.has(platform)) {
                continue
            }
            for (let social_account of block_entry.social_accounts.get(platform) || []) {
                if (social_account !== undefined) {
                    accounts.push(social_account)
                }
            }
        }
        return accounts
    }


    async queue_block_social_accounts(handle_store: HandleStore, platform: string) {
        console.log(`Queueing accounts to block for platform: ${platform}`)
        let accounts: iSocialAccount[] = this.get_accounts_by_platform(platform)
        for (let account of accounts) {
            handle_store.add(account.handle, platform, SocialAccountStoredStatus.TO_BLOCK)
        }
    }

    async queue_unblock_social_accounts(handle_store: HandleStore, platform: string) {
        console.log(`Queueing accounts to unblock for platform: ${platform}`)
        let accounts: iSocialAccount[] = this.get_accounts_by_platform(platform)
        for (let account of accounts) {
            handle_store.update_status(
                account.handle, platform,
                SocialAccountStoredStatus.TO_UNBLOCK,
                PlatformAccountStatus.UNKNOWN
            )
        }
    }
    private async download(): Promise<IBlockList> {
        /**
         * Download the list from the URL.
         */
        let response: Response = await fetch(this.download_url.href);
        if (response.status === 200) {
            let text: string = await response.text();
            let list_data: IBlockList = yaml.load(text) as IBlockList;
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

    private get_keyname(key: string): string {
        /**
         * Get the keyname for the list in storage
         */
        return `list_${key}`;
    }
    // Used for test purposes
    // from_file(filename: string): number {
    //     let text: string = fs.readFileSync(filename, 'utf8');
    //     let data: IBlockList = yaml.load(text) as IBlockList ;
    //     this.list = data;
    //     return this.list.block_list.length;
    // }
}
