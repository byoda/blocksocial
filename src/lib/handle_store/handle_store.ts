// Class for storing handles by the service worker

import Dexie, { type Table } from 'dexie';

import StoredSocialAccount from './stored_social_account';

import { SocialAccountStoredStatus } from '../datatypes';


export default class HandleStore extends Dexie {
    handles!: Table<StoredSocialAccount, 'key_id'>

    constructor() {
        super('HandlesDb')
        this.version(1).stores(
            {
                handles: 'key_id,handle,platform,block_status,last_changed'
            }
        )
        this.handles.mapToClass(StoredSocialAccount)
    }

    get_key(handle: string, platform: string): string {
        return `${platform}:${handle}`
    }

    async get(handle: string, platform: string): Promise<StoredSocialAccount | undefined> {
        let key: string = this.get_key(handle, platform)
        return await this.handles.get(
            {
                key_id: key
            }
        )
    }

    async add(handle: string, platform: string, block_status: string = SocialAccountStoredStatus.NEW): Promise<void> {
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
                    last_changed: new Date()
                } as StoredSocialAccount
            )
        } catch (exc) {
            console.error(`Error adding handle: ${exc}`)
        }
    }

    async update_status(handle: string, platform: string, block_status: string): Promise<void> {
        let key: string = this.get_key(handle, platform)
        await this.handles.put(
            {
                key_id: key,
                handle: handle,
                platform: platform,
                block_status: block_status,
                last_changed: new Date()
            } as StoredSocialAccount
        )
    }

    async get_by_status(status: string): Promise<StoredSocialAccount[]> {
        return await this.handles.where('block_status').equals(status).toArray()
    }

    async get_by_platform(platform: string): Promise<StoredSocialAccount[]> {
        let handles: StoredSocialAccount[] = await this.handles.where('platform').equals(platform).toArray()
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