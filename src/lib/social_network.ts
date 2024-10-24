import browser from 'webextension-polyfill';

import HandleStore from './handle_store/handle_store';

import StoredSocialAccount from './handle_store/stored_social_account';

import {SocialAccountStoredStatus} from './datatypes'

export class SocialNetwork {
    name: string
    url: string
    supported: boolean
    jwt: string | undefined
    csrf_token: string | undefined
    blocked_handles: Set<string> = new Set()
    all_handles: Set<string> = new Set()

    constructor(
            name: string, url: string, supported: boolean = false,
            jwt: string | undefined = undefined,
            csrf_token: string | undefined = undefined) {
        this.name = name
        this.url = url
        this.supported = supported
        this.jwt = jwt
        this.csrf_token = csrf_token
    }

    get_keyname(key: string): string {
        return `${key}_${this.name.toLowerCase()}`
    }

    async load_handles(handle_store: HandleStore) {
        let accounts: StoredSocialAccount[] = await handle_store.get_by_platform(
            this.name.toLowerCase()
        )
        console.log('Found accounts:', accounts.length)
        for (let account of accounts) {
            // console.log(`Found account in IndexedDB: ${account.handle}: status: ${account.block_status}`)
            this.all_handles.add(account.handle);
            if (account.block_status === SocialAccountStoredStatus.BLOCKED) {
                this.blocked_handles.add(account.handle);
            }
        }
    }
}