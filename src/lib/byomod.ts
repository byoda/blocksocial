// Class containing all the data for BYOMod and methods to load/save them

import type {iListOfLists, iListStat} from './datatypes'

import ByoList from './list'
import ByoStorage from './storage'
import HandleStore from '../lib/handle_store/handle_store'

import {LIST_OF_LISTS_URL} from './constants'
import {SOCIAL_NETWORKS_BY_PLATFORM} from './constants'


export default class ByoMod {
    storage: ByoStorage
    handle_store: HandleStore
    subscribed_lists: iListOfLists
    lists: Map<string, ByoList> = new Map<string, ByoList>
    list_of_lists: Map<string,iListStat> = new Map<string, iListStat>()

    constructor(handle_store: HandleStore) {
        this.storage = new ByoStorage()
        this.handle_store = handle_store

        this.subscribed_lists = this.storage.load_subscribed_lists_sync()
        if (this.subscribed_lists === undefined
                || this.subscribed_lists.lists === undefined
                || this.subscribed_lists.lists.size === 0) {
            this.subscribed_lists = {
                lists: new Set<string>()
            }
        }
    }

    async download_list_of_lists(url: string): Promise<Map<string,iListStat>> {
        const resp: Response = await fetch(url)
        console.log(`Downloaded list of lists from ${url}`)
        if (!resp.ok) {
            console.error('Failed to download list of lists')
            return new Map<string,iListStat>()
        }
        try {
            let lists: iListStat[] = await resp.json() as iListStat[]
            for (let list of lists) {
                this.list_of_lists.set(list.url, list)
                if (this.subscribed_lists.lists.has(list.url)) {
                    list.subscribed = true
                } else {
                    list.subscribed = false
                }
                // JSON parser does not parse to Map so we have to do it
                // manually
                let counter_obj: Object = list.counters
                let mapped_counters: Map<string, number> = new Map(Object.entries(counter_obj))
                list.counters = mapped_counters
                console.log(`Result: ${list.name} - ${list.counters.get('twitter')}`)
            }
            return this.list_of_lists
        } catch (e) {
            console.error(`Failed to parse list of lists JSON: ${e}`)
            return new Map<string,iListStat>()
        }
    }

    async get_subscribed_lists(): Promise<Map<string, iListStat>> {
        if (this.list_of_lists.size == 0) {
            await this.download_list_of_lists(LIST_OF_LISTS_URL)
        }
        let subscribed_lists: Map<string, iListStat> = new Map<string, iListStat>()
        for (let list of this.list_of_lists.values()) {
            if (this.subscribed_lists.lists.has(list.url)) {
                list.subscribed = true
                subscribed_lists.set(list.url, list)
            }
        }
        return subscribed_lists
    }

    async get_unsubscribed_lists(): Promise<Map<string, iListStat>> {
        if (this.list_of_lists.size == 0) {
            await this.download_list_of_lists(LIST_OF_LISTS_URL)
        }
        let unsubscribed_lists: Map<string, iListStat> = new Map<string, iListStat>()
        for (let list of this.list_of_lists.values()) {
            if (! this.subscribed_lists.lists.has(list.url)) {
                list.subscribed = false
                unsubscribed_lists.set(list.url, list)
            }
        }
        return unsubscribed_lists
    }

    async load_lists() {
        // console.log('Loading lists')
        let subscribed_lists: Map<string, ByoList> = new Map<string, ByoList>()
        for (let mod_list of this.subscribed_lists.lists) {
            // console.log('Reading URL: ', mod_list)
            let byo_list: ByoList = new ByoList(mod_list)
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

        if (this.subscribed_lists.lists.has(list_url)) {
            console.info(`List already subscribed: ${list_url}`)
            return
        }

        try {
            let new_list: ByoList = new ByoList(list_url)
            try {
                await new_list.download()
                await new_list.save()
            } catch (e) {
                console.error('Failed to download list and save: ', list_url)
                return
            }
            if (new_list.list === undefined) {
                console.error(`List without entries: ${list_url}`)
                return
            }

            for (let [platform, net] of SOCIAL_NETWORKS_BY_PLATFORM) {
                if (net === undefined || net.supported === false) {
                    continue
                }
                if (new_list.list.block_list === undefined) {
                    console.log(`No block list for platform: ${platform}`)
                    continue
                }
                await new_list.store_social_accounts(this.handle_store, platform)
            }
        } catch (e) {
            console.error('Invalid URL: ', list_url, e)
            return
        }
        this.subscribed_lists.lists.add(list_url)
        this.subscribed_lists.lists = this.subscribed_lists.lists
        await this.save_subscribed_lists()
        console.log(`List added: ${list_url}`)

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
