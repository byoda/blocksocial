import browser from 'webextension-polyfill';

import type {ISocialNetworkAuth} from '../datatypes'

import SecretStore from '../secret_store/secret_store'
import StoredSecret from '../secret_store/stored_secrets';

const TokenExpiration: number = 60 * 60 * 24

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

class AuthToken {
    type: AuthTokenType
    value: string | undefined
    expires: number = Date.now()
    platform: string = 'twitter'

    constructor(auth_token_type: AuthTokenType,
                value: string | undefined,
                expiration: number = TokenExpiration,
                platform: string = 'twitter') {
        this.type = auth_token_type
        this.value = value
        this.platform = platform
        this.expires = Math.floor(Date.now() / 1000) + expiration
    }
}


export class SocialAuth {
    jwt: string | undefined
    csrf_token: string | undefined
    expires: number

    constructor(jwt: string | undefined, csrf_token: string | undefined,
                expiration: number = 0) {
        this.jwt = jwt
        this.csrf_token = csrf_token
        if (expiration == 0) {
            this.expires = Date.now()
        } else {
            this.expires = Date.now() + expiration
        }
    }

    is_expired(): boolean {
        return Date.now() > this.expires
    }

    reset_expiration(expiration: number = TokenExpiration) {
        this.expires = Date.now() + expiration
    }

    as_interface(): ISocialNetworkAuth {
        return {
            name: 'none',
            jwt: this.jwt,
            csrf_token: this.csrf_token,
            cookie_auth: undefined,
            expires: this.expires
        } as ISocialNetworkAuth
    }

    static from_interface(auth: ISocialNetworkAuth) {
        return new SocialAuth(auth.jwt, auth.csrf_token, auth.expires)
    }

    async from_storage(secret_store: SecretStore): Promise<void> {
        let secrets: StoredSecret[] = await secret_store.get_by_platform('twitter')
        for (let secret of secrets) {
            if (secret.auth_token_type == 'jwt') {
                this.jwt = secret.value
            } else if (secret.auth_token_type == 'csrf_token') {
                this.csrf_token = secret.value
            }
        }

        this.reset_expiration()

        console.log(
            `Read from Secret store ${this.jwt}, ${this.csrf_token}`
        )
    }

}


export default class TwitterAuth extends SocialAuth {
    cookie_auth: string | undefined = undefined
    graphql_token: string | undefined = undefined

    constructor(jwt: string | undefined, csrf_token: string | undefined,
                cookie_auth: string | undefined = undefined,
                graphql_token: string | undefined = undefined, expiration: number = 0) {
        super(jwt, csrf_token, expiration)
        this.cookie_auth = cookie_auth
        this.graphql_token = graphql_token
    }

    as_interface(): ISocialNetworkAuth {
        return {
            name: 'twitter',
            jwt: this.jwt,
            csrf_token: this.csrf_token,
            graphql_token: this.graphql_token,
            cookie_auth: this.cookie_auth
        } as ISocialNetworkAuth
    }

    static from_interface(auth: ISocialNetworkAuth) {
        return new TwitterAuth(
            auth.jwt, auth.csrf_token, auth.cookie_auth,
            auth.graphql_token, auth.expires
        )
    }

    static async from_storage(secret_store: SecretStore): Promise<TwitterAuth> {
        let auth = new TwitterAuth(undefined, undefined, undefined, undefined)

        let secrets: StoredSecret[] = await secret_store.get_by_platform('twitter')
        if (! secrets || secrets.length == 0) {
            return auth
        }

        for (let secret of secrets) {
            if (secret.expires > 0 && secret.expires < auth.expires) {
                auth.expires = secret.expires
            }

            if (secret.auth_token_type == 'jwt') {
                auth.jwt = secret.value
            } else if (secret.auth_token_type == 'csrf_token') {
                auth.csrf_token = secret.value
            } else if (secret.auth_token_type == 'auth_cookie') {
                auth.cookie_auth = secret.value
            } else if (secret.auth_token_type == 'graphql_token') {
                auth.graphql_token = secret.value
            }
        }

        console.log(
            `Read from Secret store ${auth.jwt}, `,
            `${auth.csrf_token}, ${auth.cookie_auth}`
        )

        return auth
    }

    public grab_auth_tokens(headers: browser.WebRequest.HttpHeaders) {
        if (headers == undefined || headers.length) {
            return
        }

        let jwt_updated: boolean = false
        let csrf_updated: boolean = false
        let cookie_updated: boolean = false

        for (let i = 0, l = headers.length; i < l; ++i) {
            if (headers[i].name === 'authorization') {
                this.jwt = headers[i].value
                jwt_updated = true
            } else if (headers[i].name === 'x-csrf-token') {
                this.csrf_token = headers[i].value
                csrf_updated = true
            } else if (headers[i].name == 'Cookie') {
                this.cookie_auth = this.parse_cookie(headers[i].value || '', 'auth_token')
                cookie_updated = true
            }
        }
        if (jwt_updated && csrf_updated && cookie_updated) {
            console.log('Updated auth tokens, resetting expiration')
            this.reset_expiration()
        }
    }

    private parse_cookie(cookie: string, key: string): string | undefined {
        const nameLenPlus = (key.length + 1);
        return cookie
          .split(';')
          .map(cookie => cookie.trim())
          .find(cookie => cookie.substring(0, nameLenPlus) === `${key}=`)
          ?.split('=')[1];
      }
}
