import { Entity } from 'dexie';

import type SecretStore from './secret_store';

export default class StoredSecret extends Entity<SecretStore> {
    key_id!: string
    platform!: string
    secret_type!: string
    value!: string

    get_key_id(platform: string, secret_type: string): string {
        return `${platform}_${secret_type}`
    }

    async get(secret_type: string, platform: string): Promise<StoredSecret | undefined> {
        return await this.db.secrets.get(
            {
                secret_type, platform
            }
        )
    }

    async add(platform: string, secret_type: string, value: string): Promise<void> {
        this.key_id = this.get_key_id(platform, secret_type)
        this.platform = platform
        this.secret_type = secret_type
        this.value = value

        await this.db.secrets.add(
            {
                platform: platform,
                secret_type: secret_type,
                value: value
            } as StoredSecret
        )
    }
}
