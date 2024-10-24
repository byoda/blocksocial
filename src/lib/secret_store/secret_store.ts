// Class for storing secrets by the service worker

import Dexie, { type Table } from 'dexie';

import StoredSecret from './stored_secrets';

import type { iSocialNetworkAuth } from '../datatypes';


export default class SecretStore extends Dexie {
    secrets!: Table<StoredSecret, 'key_id'>

    constructor() {
        super('SecretsDb')
        this.version(1).stores(
            {
                secrets: 'key_id,platform,secret_type,value'
            }
        )
        this.secrets.mapToClass(StoredSecret)
    }

    get_key_id(platform: string, secret_type: string): string {
        return `${platform}_${secret_type}`
    }

    async upsert(auth: iSocialNetworkAuth, platform: string): Promise<void> {
        let secret_types: string[] = ['jwt', 'csrf_token', 'graphql_token']
        let value: string | undefined = undefined
        for (let secret_type of secret_types) {
            if (secret_type == 'jwt') {
                value = auth.jwt
            } else if (secret_type == 'csrf_token') {
                value = auth.csrf_token
            } else if (secret_type == 'graphql_token') {
                value = auth.graphql_token
            }
            if (value === undefined) {
                if (secret_type !== 'graphql_token') {
                    console.log('No value for secret type: ' + secret_type)
                }
                continue
            }
            let key_id: string = this.get_key_id(platform, secret_type)
            let data: StoredSecret = {
                key_id: key_id,
                platform: platform,
                secret_type: secret_type,
                value: value
            } as StoredSecret

            let new_key_id = await this.secrets.put(data)
            // console.log(`Upserted: ${key_id}: ${value}, returned key_id ${new_key_id}`)

            // let new_data = await this.secrets.get(new_key_id)
            // console.log('Validate SECRET_STORE works: ', new_data)
        }
    }

    async get_by_platform(platform: string): Promise<StoredSecret[]> {
        return await this.secrets.where('platform').equals(platform).toArray()
    }

    async get(platform: string, secret_type: string): Promise<StoredSecret[]> {
        let secrets: StoredSecret[] =  await this.secrets.where('platform').equals(platform).toArray()
        return secrets.filter((secret) => secret.secret_type === secret_type)
    }
}