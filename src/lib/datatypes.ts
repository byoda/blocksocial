export enum SocialAccountStoredStatus {
    TO_BLOCK = 'TO_BLOCK',
    BLOCKED = 'BLOCKED',
    ATTEMPTED_BLOCK = 'ATTEMPTED_BLOCK',
    UNBLOCKED = 'UNBLOCKED',
    TO_UNBLOCK = 'TO_UNBLOCK',
    ATTEMPTED_UNBLOCK = 'ATTEMPTED_UNBLOCK',
}

export enum AuthTokenType {
    JWT = 'jwt',
    CSRF_TOKEN = 'csrf_token',
    AUTH_COOKIE = 'auth_cookie',
    GRAPHQL_TOKEN = 'graphql_token',
}

export function string_to_auth_token_type(value: string): AuthTokenType {
    switch (value.toLowerCase()) {
        case 'jwt':
            return AuthTokenType.JWT
        case 'csrf_token':
            return AuthTokenType.CSRF_TOKEN
        case 'auth_cookie':
            return AuthTokenType.AUTH_COOKIE
        case 'graphql_token':
            return AuthTokenType.GRAPHQL_TOKEN
        default:
            throw new Error(`Unknown AuthTokenType: ${value}`)
    }
}

export interface iSocialNetworkAuth {
    name: string
    jwt: string | undefined

    // Twitter uses CSRF Tokens
    csrf_token: string | undefined

    // Twitter GraphQL APIs use a token in the GET URL, ie.
    // https://x.com/i/api/graphql/<token>/BlockedAccounts
    graphql_token: string | undefined

    // Twitter also needs a cookie value for auth
    cookie_auth: string | undefined
}


// Used for saving the List-of-Lists as string to local storage
export interface iListOfLists {
    lists: Set<string>
}

// The stats included in the central hosted list of lists
export interface iListStat {
    name: string
    last_updated: Date
    url: string
    counters: Map<string, number>
    categories: string[]
    subscribed: boolean | undefined
}

export interface IBlockList {
    meta: IBlockListMeta
    block_list: iBlockEntry[]
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

export interface iSocialAccount {
    platform: string
    handle: string
    url: string
    is_primary: boolean
}

export interface iBlockEntry {
    first_name: string
    last_name: string
    business_name: string
    business_type: string
    status: string
    languages: string[]
    categories: string[]
    annotations: string[]
    urls: string[]
    social_accounts: iSocialAccount[]
}


export interface iMessage<Type> {
    source: string
    type: string
    data: Type
}

// Currently unused, was used for messages
export interface iSocialAccountPush {
    list: string,
    accounts: iSocialAccount[]
}

// Currently unused, planned use for tracking social account stats
export interface iAccountStat {
    timestamp: Date;
    followers: number;
    assets: number;
    views: number;
}