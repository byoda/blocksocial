console.log('TwitterAccount.ts loaded')

import TwitterAuth from '../auth/auth_tokens'
import ByoStorage from '../storage'

const block_url: string = 'https://x.com/i/api/1.1/blocks/create.json'
const unblock_url: string = 'https://api.x.com/1.1/blocks/destroy.json'
const list_blocks_url: string = 'https://api.x.com/1.1/blocks/list.json'
const user_id_lookup_url: string = 'https://api.x.com/1.1/users/lookup.json'

export interface ITwitterPaginatedResponse<T> {
    data: T[]
    paging_token: string | undefined
}

export interface ITwitterUser {
    id: string
    id_str: string
    name: string
    screen_name: string
    location: string
    description: string
    followers_count: number
    fast_followers_count: number
    normal_followers_count: number
    friends_count: number
    listed_count: number
    created_date: Date
    favourites_count: number
    verified: boolean
    statuses_count: number
    media_count: number
    pinned_tweet_ids: string[]
    profile_image_url_https: string
}

interface ITwitterId
{
    user_id: string
}

export default class TwitterAccount {
    /**
     * Manages blocking and unblocking Twitter handles for a Twitter account.
     * @param auth: TwitterAuth - The authentication tokens required to
     *              authorize requests to the Twitter API.
     * @param storage: ByoStorage - The storage object used to store user_id's
     *                 for Twitter handles. Storage is not available in service_worker
     * @returns
     */
    auth: TwitterAuth
    storage: ByoStorage | undefined

    constructor(
        storage: ByoStorage | undefined = undefined,
        auth: TwitterAuth | undefined = undefined) {
        this.storage = storage

        if (auth) {
            this.auth = auth
        } else {
            this.auth = new TwitterAuth(
                undefined, undefined, undefined, undefined, 0
            )
        }
    }

    public get_headers(content_type: string | undefined = undefined): HeadersInit {
        let cookie_header: string = `ct0=${this.auth.csrf_token}, auth_token=${this.auth.cookie_auth}`
        if (! content_type) {
            content_type = 'application/x-www-form-urlencoded'
        }
        let headers: HeadersInit = {
            'authorization': this.auth.jwt!,
            'X-Csrf-Token': this.auth.csrf_token!,
            'Cookie': cookie_header,
            'Content-Type': content_type,
        }
        return headers
    }

    public async get_user_id(handle: string): Promise<string | undefined> {
        let headers: HeadersInit = this.get_headers('text/plain')

        try {
            const response = await fetch(
                user_id_lookup_url + '?screen_name=' + handle,
                {
                    method: 'GET',
                    headers: headers,
                }
            )
            if (response.status === 200) {
                let data = await response.json() as ITwitterUser
                return data.id_str
            } else {
                console.log(
                    `Failed to get Twitter settings: ${response.status}`,
                    await response.text()
                )
            }
        } catch (e) {
            console.log(`Failed to get Twitter settings: ${e}`)
        }
    }

    public async get_blocked_handles(): Promise<ITwitterUser[] | undefined> {
        /**
         * Gets a list of Twitter handles that are blocked by the authenticated user.
         *
         * @returns A promise that resolves to a list of Twitter handles that
         * are blocked by the authenticated user or undefined if the Twitter API
         * request fails.
         *  @see {@link https://developer.x.com/en/docs/x-api/v1/accounts-and-users/mute-block-report-users/api-reference/get-blocks-list | Twitter API Documentation}
         */
        console.log('Getting blocked Twitter handles')
        let paging_token: string | undefined = undefined
        let users: ITwitterUser[] = []
        if (this.auth === undefined) {
            console.log('No auth tokens found')
            return undefined
        }

        let headers: HeadersInit = this.get_headers('application/json')
        do {
            try {
                const response = await fetch(
                    list_blocks_url,
                    {
                        method: 'GET',
                        headers: headers,
                    }
                )
                if (response.status === 200) {
                    let data = await response.json() as ITwitterPaginatedResponse<ITwitterUser>
                    console.log(data)
                    users.push(...data.data)
                } else {
                    console.log(`Failed to get Twitter handles blocked: ${response.status}`)
                    console.log(response.text())
                }
            } catch (e) {
                console.log(`Failed to get Twitter handles blocked: ${e}`)
            }
        } while (paging_token !== undefined)

        return users
    }

    /**
     * Blocks a Twitter handle using the provided authentication tokens.
     *
     * @param handle - The Twitter handle to block.
     * @param auth_tokens - The authentication tokens required to authorize the request.
     * @returns A promise that resolves to a boolean indicating whether the block was without failure (404's are not considered failures)
     *
     * @remarks
     * This function makes a POST request to the Twitter API to block the specified handle.
     * It requires both a CSRF token and a JWT for authorization.
     *
     * @see {@link https://developer.x.com/en/docs/x-api/v1/accounts-and-users/mute-block-report-users/api-reference/post-blocks-create | Twitter API Documentation}
     */
    public async block_handle(handle: string): Promise<boolean> {
        console.log(`Blocking Twitter handle ${handle}`)
        try {
            if (this.auth.jwt === undefined || this.auth.csrf_token === undefined) {
                console.log('No auth tokens found')
                return false
            }
            let headers: HeadersInit = this.get_headers('application/x-www-form-urlencoded')
            const response = await fetch(
                block_url,
                {
                    method: 'POST',
                    headers: headers,
                    credentials: 'include',
                    body: 'screen_name=' + handle
                }
            )
            if (response.status === 200) {
                console.log(`Blocked Twitter handle: ${handle}`)
                let data = await response.text() as unknown
                let twitter_user: ITwitterUser = data as ITwitterUser
                console.log(
                    `Blocked user ${handle} for user_id: ${twitter_user.id_str}`
                )
                return true
            } else if (response.status === 404) {
                console.log('User not found: ' + handle)
                return true
            } else {
                console.log(
                    `Failed to block Twitter handle: ${response.status}`,
                    await response.text()
                )
                return false
            }
        } catch (e) {
            console.log(`Block failed: ${e}`)
            return false
        }
    }

    /**
     * Unblocks a Twitter handle using the provided authentication tokens.
     *
     * @param handle - The Twitter handle to block.
     * @param auth_tokens - The authentication tokens required to authorize the request.
     * @returns A promise that resolves to a boolean indicating whether the block was without failure (404's are not considered failures)
     *
     * @remarks
     * This function makes a POST request to the Twitter API to block the specified handle.
     * It requires both a CSRF token and a JWT for authorization.
     *
     * @see {@link https://developer.x.com/en/docs/x-api/v1/accounts-and-users/mute-block-report-users/api-reference/post-blocks-create | Twitter API Documentation}
     */
    public async unblock_handle(handle: string): Promise<boolean> {
        console.log(`Unlocking Twitter handle ${handle}`)
        try {
            if (this.auth.jwt === undefined || this.auth.csrf_token === undefined) {
                console.log('No auth tokens found')
                return false
            }
            let user_id: string | undefined = await this.get_user_id(handle)
            if (user_id === undefined) {
                console.log(`Failed to get user_id for handle: ${handle}`)
                return false
            }
            const response = await fetch(
                unblock_url,
                {
                    method: 'POST',
                    headers: {
                        'authorization': this.auth.jwt!,
                        'X-Csrf-Token': this.auth.csrf_token!,
                        // Twitter POST body is plain text instead of form urlencoded
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    credentials: 'include',
                    body: `user_id=${user_id}`
                }
            )
            if (response.status === 200) {
                console.log(
                    `Unblocked Twitter handle: ${handle}',
                    'with user_id: ${user_id}`
                )
                return true
            } else if (response.status === 404) {
                console.log('User not found: ' + handle)
                return true
            } else {
                console.log(
                    `Failed to unblock Twitter handle ${handle}: ${response.status}`
                    , await response.text()
                )
                return false
            }
        } catch (e) {
            console.log(e)
            return false
        }
    }

    public store_user_id(handle: string, user_id: string) {
        if (this.storage === undefined) {
            console.log('No storage found, are we in a service worker?')
            return
        }
        let key_id: string = this.get_user_key_id(handle)
        let data = {user_id: user_id}
        console.log(`Storing user_id ${user_id} for user ${handle}`)
        this.storage!.set(key_id, data)
    }

    public retrieve_user_id(handle: string): string | undefined {
        if (this.storage === undefined) {
            console.log('No storage found, are we in a service worker?')
            return
        }
        let key_id: string = this.get_user_key_id(handle)
        let data = this.storage!.get(key_id) as ITwitterId
        console.log(`Retrieved user_id: ${data.user_id}`)
        return data.user_id
    }

    private get_user_key_id(user_id: string): string {
        return `twitter_user_id_${user_id}`
    }
}

