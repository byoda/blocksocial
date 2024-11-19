export enum SocialAccountStoredStatus {
    TO_BLOCK = 'TO_BLOCK',
    BLOCKED = 'BLOCKED',
    ATTEMPTED_BLOCK = 'ATTEMPTED_BLOCK',
    UNBLOCKED = 'UNBLOCKED',
    TO_UNBLOCK = 'TO_UNBLOCK',
    ATTEMPTED_UNBLOCK = 'ATTEMPTED_UNBLOCK',
}
export function string_to_social_account_stored_status(value: string): SocialAccountStoredStatus {
    switch (value.toLowerCase()) {
        case 'to_block':
            return SocialAccountStoredStatus.TO_BLOCK
        case 'blocked':
            return SocialAccountStoredStatus.BLOCKED
        case 'attempted_block':
            return SocialAccountStoredStatus.ATTEMPTED_BLOCK
        case 'unblocked':
            return SocialAccountStoredStatus.UNBLOCKED
        case 'to_unblock':
            return SocialAccountStoredStatus.TO_UNBLOCK
        case 'attempted_unblock':
            return SocialAccountStoredStatus.ATTEMPTED_UNBLOCK
        default:
            throw new Error(`Unknown SocialAccountStoredStatus: ${value}`)
    }
}

export enum PlatformAccountStatus {
    UNBLOCKED = 'UNBLOCKED',
    BLOCKED = 'BLOCKED',
    UNKNOWN = 'UNKNOWN',
}

export function string_to_platform_account_status(value: string): PlatformAccountStatus {
    switch (value.toLowerCase()) {
        case 'unblocked':
            return PlatformAccountStatus.UNBLOCKED
        case 'blocked':
            return PlatformAccountStatus.BLOCKED
        case 'unknown':
            return PlatformAccountStatus.UNKNOWN
        default:
            throw new Error(`Unknown PlatformAccountStatus: ${value}`)
    }
}

export interface ISocialNetworkAuth {
    name: string
    jwt: string | undefined

    // Twitter uses CSRF Tokens
    csrf_token: string | undefined

    // Twitter GraphQL APIs use a token in the GET URL, ie.
    // https://x.com/i/api/graphql/<token>/BlockedAccounts
    graphql_token: string | undefined

    // Twitter also needs a cookie value for auth
    cookie_auth: string | undefined

    expires: number | undefined
}


// Used for saving the List-of-Lists as string to local storage
export interface IListOfLists {
    lists: Set<string>
}

// The stats included in the central hosted list of lists
export interface IListStat {
    name: string
    last_updated: Date
    url: string
    counters: Map<string, number>
    categories: string[]
    subscribed: boolean | undefined
}

export interface IBlockList {
    meta: IBlockListMeta
    block_list: IBlockEntry[]
    trust_list: string[]
}

export interface IBlockListMeta {
    author_email: string
    author_name: string
    author_url: string
    categories: Object
    list_name: string
    last_updated: Date
    download_url: string
}

export interface IBlockListCategory {
    name: string
    description: string
}

export interface ISocialAccountListStat {
    platform: string
    handle: string
    url: string
    is_primary: boolean
}

export interface IBlockEntry {
    first_name: string
    last_name: string
    business_name: string
    business_type: string
    status: string
    languages: string[]
    categories: string[]
    annotations: string[]
    urls: string[]
    social_accounts: ISocialAccountListStat[]
}


export interface IMessage<Type> {
    source: string
    type: string
    data: Type
}

// Currently unused, was used for messages
export interface ISocialAccountListStatPush {
    list: string,
    accounts: ISocialAccountListStat[]
}

// Currently unused, planned use for tracking social account stats
export interface IAccountStat {
    timestamp: Date;
    followers: number;
    assets: number;
    views: number;
}