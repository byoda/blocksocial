import { Entity } from 'dexie';

import type SecretStore from './secret_store';
import {AuthTokenType} from '../auth/auth_tokens'

export default class StoredSecret extends Entity<SecretStore> {
    key_id!: string
    platform!: string
    auth_token_type!: AuthTokenType
    value!: string
    expires!: number

    get_key_id(platform: string, auth_token_type: AuthTokenType): string {
        return `${platform}_${auth_token_type.valueOf()}`
    }

    async get(auth_token_type: AuthTokenType, platform: string): Promise<StoredSecret | undefined> {
        let auth_token_type_value: string = auth_token_type.valueOf()
        return await this.db.secrets.get(
            {
                auth_token_type_value, platform
            }
        )
    }

    async add(platform: string, auth_token_type: AuthTokenType, value: string, expires: number): Promise<void> {
        this.key_id = this.get_key_id(platform, auth_token_type)
        this.platform = platform
        this.auth_token_type = auth_token_type
        this.value = value

        await this.db.secrets.add(
            {
                platform: platform,
                auth_token_type: auth_token_type.valueOf(),
                value: value,
                expires: expires
            } as StoredSecret
        )
    }
}
