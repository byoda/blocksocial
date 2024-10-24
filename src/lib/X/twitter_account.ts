console.log('TwitterAccount.ts loaded')
import type {iSocialNetworkAuth} from '..//datatypes'

const block_endpointURL: string = 'https://x.com/i/api/1.1/blocks/create.json'
const unblock_endpointURL: string = 'https://api.x.com/1.1/blocks/destroy.json'
// const blocks_endpointURL: string = 'https://api.x.com/2/users/:id/blocking'
const blocks_endpointURL: string = 'https://api.x.com/1.1/blocks/list.json?cursor=-1'
// const user_id: string = '1552795969959636992'
// const my_user_id: string = '2250704250'

export interface iTwitterPaginatedResponse<T> {
    data: T[]
    paging_token: string | undefined
}

export interface iTwitterUser {
    id: string
    name: string
    username: string
}


export default class TwitterAccount {
    public static async get_blocked_handles(
        auth_tokens: iSocialNetworkAuth
    ): Promise<iTwitterUser[] | undefined> {
        //
        // This doesn't work as we don't know how to generate a new token
        // for GraphQL requests
        //
        console.log('Getting blocked Twitter handles')
        let paging_token: string | undefined = undefined
        let users: iTwitterUser[] = []
        if (auth_tokens.jwt === undefined || auth_tokens.csrf_token === undefined) {
            console.log('No auth tokens found')
            return undefined
        }
        let csrfToken: string | undefined = auth_tokens!.csrf_token
        let authToken: string | undefined = auth_tokens!.jwt

        let cookie_auth_token: string = 'da0f018d0b02064ef73dd1fe65208d1516b00a77'
        let cookie: string = 'ct0=' + csrfToken + ';auth_token=' + cookie_auth_token + ';'
        do {
            try {
                const response = await fetch(
                    blocks_endpointURL,
                    {
                        method: 'GET',
                        headers: {
                            'authorization': authToken,
                            'X-Csrf-Token': csrfToken,
                            'Cookie': cookie,
                            'Origin': 'https://x.com',
                        },
                        credentials: 'include',
                        // mode: 'no-cors',
                    }
                )
                if (response.status === 200) {
                    let data = await response.json() as iTwitterPaginatedResponse<iTwitterUser>
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
    public static async block_handle(handle: string, auth_tokens: iSocialNetworkAuth): Promise<boolean> {
        console.log(`Blocking Twitter handle ${handle}`)
        try {
            let csrfToken: string | undefined = auth_tokens!.csrf_token
            let authToken: string | undefined = auth_tokens!.jwt
            if (authToken === undefined || csrfToken === undefined) {
                console.log('No auth tokens found')
                return false
            }
            const response = await fetch(
                block_endpointURL,
                {
                    method: 'POST',
                    headers: {
                        'authorization': authToken!,
                        'X-Csrf-Token': csrfToken!,
                        // Twitter POST body is plain text instead of form urlencoded
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    credentials: 'include',
                    body: 'screen_name=' + handle
                }
            )
            if (response.status === 200) {
                let data = await response.json()
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

