import { Entity } from 'dexie';

import type HandleStore from './handle_store';

export default class StoredSocialAccount extends Entity<HandleStore> {
    key_id!: string
    handle!: string
    platform!: string
    block_status!: string
    last_changed: Date = new Date()
}
