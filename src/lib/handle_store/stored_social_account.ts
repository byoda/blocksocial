import { Entity } from 'dexie';

import type HandleStore from './handle_store';

import {
    PlatformAccountStatus,
    SocialAccountStoredStatus,
} from '../datatypes';

export default class StoredSocialAccount extends Entity<HandleStore> {
    key_id!: string
    handle!: string
    platform!: string
    block_status!: SocialAccountStoredStatus
    platform_status!: PlatformAccountStatus
    last_changed: Date = new Date()
}
