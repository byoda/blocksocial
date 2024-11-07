// Class for storing handles by the service worker

import Dexie, { type Table } from 'dexie';

import StoredSocialAccount from './stored_social_account';

import {
    PlatformAccountStatus,
    SocialAccountStoredStatus,
    string_to_social_account_stored_status
} from '../datatypes';


export default class HandleStore extends Dexie {
    handles!: Table<StoredSocialAccount, 'key_id'>

    constructor() {
        super('HandlesDb')
        this.version(1).stores(
            {
                handles: 'key_id,handle,platform,block_status, platform_status,last_changed'
            }
        )
        this.handles.mapToClass(StoredSocialAccount)
    }

    get_key(handle: string, platform: string): string {
        return `${platform}:${handle}`
    }

    async get(handle: string, platform: string): Promise<StoredSocialAccount | undefined> {
        let key: string = this.get_key(handle, platform)
        let account = await this.handles.get(
            {
                key_id: key
            }
        )
        if (! account) {
            return undefined
        }
        account.block_status = string_to_social_account_stored_status(account.block_status)
        return account
    }

    async add(handle: string, platform: string, block_status: SocialAccountStoredStatus = SocialAccountStoredStatus.TO_BLOCK, platform_status: PlatformAccountStatus = PlatformAccountStatus.UNKNOWN): Promise<void> {
        let key: string = this.get_key(handle, platform)
        if (await this.get(handle, platform) !== undefined) {
            console.log(`Handle already exists: ${key}`)
            return
        }
        try {
            await this.handles.add(
                {
                    key_id: key,
                    handle: handle,
                    platform: platform,
                    block_status: block_status,
                    platform_status: platform_status,
                    last_changed: new Date()
                } as StoredSocialAccount
            )
        } catch (exc) {
            console.error(`Error adding handle: ${exc}`)
        }
    }

    async update_status(handle: string, platform: string, block_status: SocialAccountStoredStatus, platform_status: PlatformAccountStatus): Promise<void> {
        let key: string = this.get_key(handle, platform)
        await this.handles.put(
            {
                key_id: key,
                handle: handle,
                platform: platform,
                block_status: block_status,
                platform_status: platform_status,
                last_changed: new Date()
            } as StoredSocialAccount
        )
    }

    async get_by_status(status: string): Promise<StoredSocialAccount[]> {
        return await this.handles.where('block_status').equals(status).toArray()
    }

    async get_by_platform(platform: string): Promise<StoredSocialAccount[]> {
        let handles: StoredSocialAccount[] = await this.handles.where('platform').equals(platform).toArray()
        // for (let handle of handles) {
        //     handle.block_status = string_to_social_account_stored_status(handle.block_status)
        // }
        console.log(`Found handles for platform: ${platform}: ${handles.length}`)
        return handles
    }

    async get_by_platform_and_status(platform: string, status: string): Promise<StoredSocialAccount[]> {
        return await this.handles.where(
            ['platform', 'block_status']
        ).equals([platform, status]).toArray()
    }

    async get_by_handle(handle: string, platform: string): Promise<StoredSocialAccount | undefined> {
        return await this.handles.where(
            {
                handle,
                platform
            }
        ).first()
    }


}