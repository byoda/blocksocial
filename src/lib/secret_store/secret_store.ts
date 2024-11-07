// Class for storing secrets by the service worker

import Dexie, { type Table } from 'dexie'

import StoredSecret from './stored_secrets'

import type SocialAuth from '../auth/auth_tokens'

import { AuthTokenType, string_to_auth_token_type } from '../auth/auth_tokens'

export default class SecretStore extends Dexie {
    secrets!: Table<StoredSecret, 'key_id'>

    constructor() {
        super('SecretsDb')
        this.version(1).stores(
            {
                secrets: 'key_id,platform,auth_token_type, value, expires'
            }
        )
        this.secrets.mapToClass(StoredSecret)
    }

    get_key_id(platform: string, auth_token_type: AuthTokenType): string {
        return `${platform}_${auth_token_type.valueOf()}`
    }

    async upsert(auth: SocialAuth, platform: string): Promise<void> {
        let value: string | undefined = undefined
        for (let auth_token_type_str in AuthTokenType) {
            const auth_token_type: AuthTokenType = string_to_auth_token_type(
                auth_token_type_str
            )
            if (auth_token_type.toLowerCase() == AuthTokenType.JWT) {
                value = auth.jwt
            } else if (auth_token_type.toLowerCase() == AuthTokenType.CSRF_TOKEN) {
                value = auth.csrf_token
            } else if (auth_token_type.toLowerCase() == AuthTokenType.GRAPHQL_TOKEN) {
                value = auth.graphql_token
            } else if (auth_token_type.toLowerCase() == AuthTokenType.AUTH_COOKIE) {
                value = auth.cookie_auth
            }
            if (value === undefined) {
                if (auth_token_type !== AuthTokenType.GRAPHQL_TOKEN) {
                    console.log('No value for secret type: ' + auth_token_type)
                }
                continue
            }
            let key_id: string = this.get_key_id(platform, auth_token_type)
            let data: StoredSecret = {
                key_id: key_id,
                platform: platform,
                auth_token_type: auth_token_type,
                value: value,
                expires: auth.expires
            } as StoredSecret

            let new_key_id = await this.secrets.put(data)
            console.log(`Upserted: ${key_id}: ${value}, returned key_id ${new_key_id}`)
        }
    }

    async get_by_platform(platform: string): Promise<StoredSecret[]> {
        return await this.secrets.where('platform').equals(platform).toArray()
    }

    async get(platform: string, auth_token_type: AuthTokenType): Promise<StoredSecret[]> {
        let secrets: StoredSecret[] =  await this.secrets.where('platform').equals(platform).toArray()
        return secrets.filter((secret) => secret.auth_token_type === auth_token_type.valueOf())
    }
}