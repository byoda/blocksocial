/*
 * Service worker that listens for requests to social media sites and grabs auth tokens
 * to store in the secret store. For Twitter/X, it also calls the Block API
 *
 * :maintainer : Steven Hessing <steven@byoda.org>
 * :copyright  : Copyright 2024
 * :license    : GPLv3
 */

import browser from 'webextension-polyfill';

import { SocialNetwork } from '../lib/social_network';

import { PlatformAccountStatus, SocialAccountStoredStatus } from '../lib/datatypes';
import {SOCIAL_NETWORKS_BY_DOMAIN} from '../lib/constants'

import TwitterAuth from '../lib/auth/auth_tokens'

import SecretStore from '../lib/secret_store/secret_store'
import StoredSocialAccount from '../lib/handle_store/stored_social_account';
import HandleStore from '../lib/handle_store/handle_store'

import TwitterAccount from '../lib/X/twitter_account';
import ByoStorage from '../lib/storage';


let SECRET_STORE = new SecretStore()
let HANDLE_STORE = new HandleStore()
let TWITTER_ACCOUNT = new TwitterAccount()

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function launch_grab_tokens(details: browser.WebRequest.OnBeforeSendHeadersDetailsType): browser.WebRequest.BlockingResponseOrPromise | undefined  {
    console.log('Grabbing tokens')
    let url: URL = new URL(details.url)
    let fqdn: string = url.hostname.toLowerCase()

    let social_network: SocialNetwork | undefined = get_social_network(fqdn)
    if (social_network === undefined) {
        console.log('No social network for domain: ' + fqdn)
        return
    }

    if (social_network.name.toLowerCase() != SOCIAL_NETWORKS_BY_DOMAIN.get('twitter')?.name) {
        console.log(
            'We do not yet support auth tokens for social network:',
            social_network.name
        )
        return
    }

    let auth: TwitterAuth = TWITTER_ACCOUNT.auth

    let now = Math.floor(Date.now() / 1000)
    console.log(`Now ${now}, Auth expires: ${auth.expires}`)

    if (! auth.is_expired()) {
        console.log('Found unexpired Twitter auth tokens')
        return
    }

    let headers: browser.WebRequest.HttpHeaders | undefined = details.requestHeaders
    if (headers == undefined) {
        return
    }

    auth.grab_auth_tokens(details.requestHeaders!)

    SECRET_STORE.upsert(auth, 'twitter')
    return {cancel: false} as browser.WebRequest.BlockingResponse
}

function get_social_network(fqdn: string): SocialNetwork | undefined {
    let fqdn_parts: string[] = fqdn.split('.')
    if (fqdn_parts.length < 2) {
        return undefined
    }
    let tld: string = fqdn_parts[fqdn_parts.length - 1]
    let domain: string = fqdn_parts[fqdn_parts.length - 2]

    let social_domain: string = `${domain}.${tld}`
    return SOCIAL_NETWORKS_BY_DOMAIN.get(social_domain)
}

async function run_social_accounts() {
    let between_runs_wait_time: number = 60 * 1000  // 1 minute
    let twitter_auth: TwitterAuth = await TwitterAuth.from_storage(SECRET_STORE)
    TWITTER_ACCOUNT.auth = twitter_auth

    while (true) {
        if (twitter_auth.jwt === undefined || twitter_auth.csrf_token === undefined) {
            console.log('No twitter auth tokens found')
            return
        }

        // await TWITTER_ACCOUNT.get_blocked_handles()
        await _reconcile_social_accounts()
        console.log('Sleeping between social accounts run')
        await delay(between_runs_wait_time)

    }
}

async function _reconcile_social_accounts() {
    console.log('Blocking social accounts run')

    let accounts: StoredSocialAccount[] = await HANDLE_STORE.get_by_status(
        [
            SocialAccountStoredStatus.TO_BLOCK,
            SocialAccountStoredStatus.TO_UNBLOCK,
        ]
    )
    if (accounts.length === 0) {
        console.log('No accounts to block')
        return
    }
    console.log(`Accounts to block: ${accounts.length}`)

    let wait_time: number = 1 * 1000    // 1 second
    for (let account of accounts) {
        wait_time = await _reconcile_social_account(
            account, wait_time
        )
        console.log(`Sleeping ${Math.floor(wait_time / 1000)} seconds before next block`)
        await delay(wait_time)
    }
}

async function _reconcile_social_account(
        account: StoredSocialAccount,
        wait_time: number): Promise<number> {

    try {
        console.log(
            `Reconciling account ${account.handle}',
            'with target status ${account.block_status}`
        )

        let target_status: SocialAccountStoredStatus = account.block_status

        let result: boolean
        if (target_status === SocialAccountStoredStatus.TO_BLOCK) {
            result = await block_social_account(account)
            if (result && wait_time >= 2000) {
                wait_time = Math.floor(wait_time / 2)
            } else if (!result && wait_time < 300 * 1000) {
                wait_time *= 2
            }
        } else {
            // Unblocking does not work due to CORS issues
            // result = await unblock_social_account(account)
        }


    } catch (exc) {
        console.log(
            `Exception blocking handle ${account.handle} on Twitter:`, exc
        )
        if (wait_time < 300 * 1000) {
            wait_time *= 2
        }
    }
    return wait_time
}

async function block_social_account(account: StoredSocialAccount): Promise<boolean> {
    await HANDLE_STORE.update_status(
        account.handle, account.platform,
        SocialAccountStoredStatus.ATTEMPTED_BLOCK,
        PlatformAccountStatus.UNKNOWN
    )

    let result: boolean = await TWITTER_ACCOUNT.block_handle(account.handle)

    if (result) {
        await HANDLE_STORE.update_status(
            account.handle, account.platform,
            SocialAccountStoredStatus.BLOCKED,
            PlatformAccountStatus.BLOCKED
        )
        console.log(`Successfully blocked ${account.handle} on Twitter`)
    }
    return result
}

async function unblock_social_account(account: StoredSocialAccount): Promise<boolean> {
    await HANDLE_STORE.update_status(
        account.handle, account.platform,
        SocialAccountStoredStatus.ATTEMPTED_UNBLOCK,
        PlatformAccountStatus.UNKNOWN
    )

    let result: boolean = await TWITTER_ACCOUNT.unblock_handle(account.handle)

    if (result) {
        await HANDLE_STORE.update_status(
            account.handle, account.platform,
            SocialAccountStoredStatus.UNBLOCKED,
            PlatformAccountStatus.UNBLOCKED
        )
        console.log(`Successfully blocked ${account.handle} on Twitter`)
    }
    return result
}

console.log('Worker loaded')


run_social_accounts()

// Grad authentication tokens
browser.webRequest.onBeforeSendHeaders.addListener(
    launch_grab_tokens,
    {urls: ["<all_urls>"]},
    ['requestHeaders', 'extraHeaders']
)
