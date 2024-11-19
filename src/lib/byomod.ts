// Class containing all the data for BYOMod and methods to load/save them

import type {IListStat} from './datatypes'

import BlockList from './blocklist'
import ByoStorage from './storage'
import HandleStore from '../lib/handle_store/handle_store'

import {
    LIST_OF_LISTS_URL,
    SOCIAL_NETWORKS_BY_PLATFORM
} from './constants'


export default class ByoMod {
    storage: ByoStorage
    handle_store: HandleStore
    subscribed_lists: Set<string>
    // lists: Map<string, BlockList> = new Map<string, BlockList>
    list_of_lists: Map<string, IListStat> = new Map<string, IListStat>()

    constructor(handle_store: HandleStore) {
        this.storage = new ByoStorage()
        this.handle_store = handle_store
        let subscribed_lists_data = this.storage.load_subscribed_lists_sync()
        this.subscribed_lists = new Set(subscribed_lists_data)
    }

    async download_list_of_lists(url: string): Promise<Map<string,IListStat>> {
        const resp: Response = await fetch(url)
        console.log(`Downloaded list of lists from ${url}`)
        if (!resp.ok) {
            console.error('Failed to download list of lists')
            return new Map<string,IListStat>()
        }
        try {
            let lists: IListStat[] = await resp.json() as IListStat[]
            for (let list of lists) {
                this.list_of_lists.set(list.url, list)
                if (this.subscribed_lists.has(list.url)) {
                    list.subscribed = true
                } else {
                    list.subscribed = false
                }
                // JSON parser does not parse to Map so we have to convert it
                let counter_obj: Object = list.counters
                let mapped_counters: Map<string, number> = new Map(Object.entries(counter_obj))
                list.counters = mapped_counters
            }
            return this.list_of_lists
        } catch (e) {
            console.error(`Failed to parse list of lists JSON: ${e}`)
            return new Map<string,IListStat>()
        }
    }

    async get_subscribed_lists(): Promise<Map<string, IListStat>> {
        if (this.list_of_lists.size == 0) {
            await this.download_list_of_lists(LIST_OF_LISTS_URL)
        }
        let subscribed_lists: Map<string, IListStat> = new Map<string, IListStat>()
        for (let list of this.list_of_lists.values()) {
            if (this.subscribed_lists.has(list.url)) {
                list.subscribed = true
                subscribed_lists.set(list.url, list)
            }
        }
        return subscribed_lists
    }

    async get_unsubscribed_lists(): Promise<Map<string, IListStat>> {
        if (this.list_of_lists.size == 0) {
            await this.download_list_of_lists(LIST_OF_LISTS_URL)
        }
        let unsubscribed_lists: Map<string, IListStat> = new Map<string, IListStat>()
        for (let list of this.list_of_lists.values()) {
            if (! this.subscribed_lists?.has(list.url)) {
                list.subscribed = false
                unsubscribed_lists.set(list.url, list)
            }
        }
        return unsubscribed_lists
    }

    async load_lists() {
        let subscribed_lists: Map<string, BlockList> = new Map<string, BlockList>()
        for (let mod_list of this.subscribed_lists.values()) {
            let byo_list: BlockList = new BlockList(mod_list)
            let result: boolean = await byo_list.initialize()
            if (result) {
                console.log('Loading list: ', mod_list)
                subscribed_lists.set(mod_list, byo_list)
            }
        }
        return subscribed_lists
    }

    async save_subscribed_lists() {
        this.storage.save_subscribed_lists_sync(this.subscribed_lists)
    }

    async add_list(list_url: string) {
        if (!list_url) {
            console.info('Not adding list for empty URL')
            return
        }

        if (this.subscribed_lists.has(list_url)) {
            console.info(`List already subscribed: ${list_url}`)
            return
        }
        try {
            let new_list: BlockList = new BlockList(list_url)
            if (! await new_list.initialize()) {
                console.error(`Failed to initialize list: ${list_url}`)
                return
            }
            console.log(`List has ${new_list.block_entries.length} entries`)
            for (let [platform, net] of SOCIAL_NETWORKS_BY_PLATFORM) {
                if (net === undefined || net.supported === false) {
                    continue
                }
                if (new_list.block_entries === undefined || new_list.block_entries.length === 0) {
                    console.log(`No block list for platform: ${platform}`)
                    continue
                }
                await new_list.queue_block_social_accounts(this.handle_store, platform)
            }
        } catch (e) {
            console.error('Invalid URL: ', list_url, e)
            return
        }
        this.subscribed_lists.add(list_url)
        await this.save_subscribed_lists()
        console.log(`List added: ${list_url}`)
    }

    async remove_list(list_url: string) {
        console.log('Removing list: ', list_url)
        if (!list_url) {
            console.info('Not remove list for empty URL')
            return
        }

        if (! this.subscribed_lists.has(list_url)) {
            console.info(`Not subscribed to list: ${list_url}`)
            return
        }
        try {
            let new_list: BlockList = new BlockList(list_url)
            await new_list.initialize()
            console.log(`List has ${new_list.block_entries.length} entries`)
            for (let [platform, net] of SOCIAL_NETWORKS_BY_PLATFORM) {
                if (net === undefined || net.supported === false) {
                    continue
                }
                if (new_list.block_entries === undefined || new_list.block_entries.length === 0) {
                    console.log(`No block list for platform: ${platform}`)
                    continue
                }
                // Unblocking is running in to CORS issues so we disable it
                // await new_list.queue_unblock_social_accounts(this.handle_store, platform)
            }
        } catch (e) {
            console.error('Invalid URL: ', list_url, e)
            return
        }
        this.subscribed_lists.delete(list_url)
        await this.save_subscribed_lists()
        console.log(`List removed: ${list_url}`)
    }
    async load_handles() {
        let found_net_with_blocks: boolean = false
        for (let [platform, net] of SOCIAL_NETWORKS_BY_PLATFORM) {
            if (net === undefined || net.supported === false) {
                continue
            }
            console.log(`Loading handles for network: ${platform}`)
            try {
                await net.load_handles(this.handle_store)
                if (net.all_handles.size > 0) {
                    found_net_with_blocks = true
                }
            } catch (e) {
                console.error(`Failed to load handles for network ${platform}, ${e}`)
            }
        }
        console.log('Found networks with blocks: ', found_net_with_blocks)
        return found_net_with_blocks
    }
}
