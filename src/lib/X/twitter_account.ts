console.log('TwitterAccount.ts loaded')

import TwitterAuth from '../auth/auth_tokens'

const block_url: string = 'https://x.com/i/api/1.1/blocks/create.json'
const unblock_url: string = 'https://api.x.com/1.1/blocks/destroy.json'
const list_blocks_url: string = 'https://api.x.com/1.1/blocks/list.json'

export interface ITwitterPaginatedResponse<T> {
    data: T[]
    paging_token: string | undefined
}

export interface ITwitterUser {
    id: string
    name: string
    username: string
}


export default class TwitterAccount {
    /**
     * Manages blocking and unblocking Twitter handles for a Twitter account.
     * @param auth
     * @returns
     */
    auth: TwitterAuth

    constructor(auth: TwitterAuth | undefined = undefined) {
        if (auth) {
            this.auth = auth
        } else {
            this.auth = new TwitterAuth(
                undefined, undefined, undefined, undefined, 0
            )
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

        do {
            try {
                let cookie_header: string = `ct0=${this.auth.csrf_token}, auth_token=${this.auth.cookie_auth}`
                const response = await fetch(
                    list_blocks_url,
                    {
                        method: 'GET',
                        headers: {
                            'authorization': this.auth.jwt!,
                            'X-Csrf-Token': this.auth.csrf_token!,
                            'Cookie': cookie_header,
                        },
                        credentials: 'include',
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
        let auth: TwitterAuth = this.auth
        try {
            if (this.auth.jwt === undefined || this.auth.csrf_token === undefined) {
                console.log('No auth tokens found')
                return false
            }
            const response = await fetch(
                block_url,
                {
                    method: 'POST',
                    headers: {
                        'authorization': auth.jwt!,
                        'X-Csrf-Token': auth.csrf_token!,
                        // Twitter POST body is plain text instead of form urlencoded
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    credentials: 'include',
                    body: 'screen_name=' + handle
                }
            )
            if (response.status === 200) {
                console.log(`Blocked Twitter handle: ${handle}`)
                return true
            } else if (response.status === 404) {
                console.log('User not found: ' + handle)
                return true
            } else {
                console.log(`Failed to block Twitter handle: ${response.status}`)
                console.log(await response.text())
                return false
            }
        } catch (e) {
            console.log(e)
            return false
        }
    }
}

