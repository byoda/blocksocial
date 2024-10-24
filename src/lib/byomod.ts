// Class containing all the data for BYOMod and methods to load/save them

import type {iListOfLists} from './datatypes'

import ByoList from './list'
import ByoStorage from './storage'
import {SOCIAL_NETWORKS_BY_PLATFORM} from './constants'

import HandleStore from '../lib/handle_store/handle_store'


export default class ByoMod {
    storage: ByoStorage
    handle_store: HandleStore
    list_of_lists: iListOfLists
    lists: Map<string, ByoList> = new Map<string, ByoList>

    constructor(handle_store: HandleStore) {
        this.storage = new ByoStorage()
        this.handle_store = handle_store

        this.list_of_lists = this.storage.load_list_of_lists_sync()
        if (this.list_of_lists === undefined
                || this.list_of_lists.lists === undefined
                || this.list_of_lists.lists.length === 0) {
            this.list_of_lists = {
                lists: []
            }
        }
    }

    async load_lists() {
        // console.log('Loading lists')
        let all_lists: Map<string, ByoList> = new Map<string, ByoList>()
        for (let mod_list of this.list_of_lists.lists) {
            // console.log('Reading URL: ', mod_list)
            let byo_list: ByoList = new ByoList(mod_list)
            let result: boolean = await byo_list.initialize()
            if (result) {
                console.log('Loading list: ', mod_list)
                all_lists.set(mod_list, byo_list)
            }
        }
        return all_lists
    }

    async save_list_of_lists() {
        this.storage.save_list_of_lists_sync(this.list_of_lists)
    }

    async add_list(list_url: string) {
        if (!list_url) {
            console.info('Not adding list for empty URL')
            return
        }

        if (this.list_of_lists.lists.includes(list_url)) {
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
        this.list_of_lists.lists.push(list_url)
        this.list_of_lists.lists = this.list_of_lists.lists
        await this.save_list_of_lists()
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
