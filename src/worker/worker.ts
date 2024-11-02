/*
 * Service worker that listens for requests to social media sites and grabs auth tokens
 * to store in the secret store. For Twitter/X, it also calls the Block API
 *
 * :maintainer : Steven Hessing <steven@byoda.org>
 * :copyright  : Copyright 2024
 * :license    : GPLv3
 */

import browser from 'webextension-polyfill';

import SecretStore from '../lib/secret_store/secret_store'
import HandleStore from '../lib/handle_store/handle_store'
import grab_auth_tokens from './auth_tokens'
import { get_twitter_auth } from './auth_tokens'

import { SocialAccountStoredStatus } from '../lib/datatypes';
import StoredSocialAccount from '../lib/handle_store/stored_social_account';
import TwitterAccount from '../lib/X/twitter_account';

import type {iSocialNetworkAuth} from '../lib/datatypes'


let SECRET_STORE = new SecretStore()
let HANDLE_STORE = new HandleStore()

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function launch_grab_tokens(details: browser.WebRequest.OnBeforeSendHeadersDetailsType): browser.WebRequest.BlockingResponseOrPromise | undefined  {

    console.log('Launching grab tokens')
    grab_auth_tokens(SECRET_STORE, details)
    return {cancel: false} as browser.WebRequest.BlockingResponse
}

async function run_social_accounts() {
    let wait_time: number = 1 * 1000    // 1 second
    let between_runs_wait_time: number = 60 * 1000  // 1 minute
    while (true) {
        console.log('Blocking social accounts run')
        let accounts: StoredSocialAccount[] = await HANDLE_STORE.get_by_status(SocialAccountStoredStatus.TO_BLOCK)
        if (accounts.length === 0) {
            console.log(`No accounts to block, sleeping ${Math.floor(between_runs_wait_time / 1000)} seconds`)
            await delay(between_runs_wait_time)
            continue
        }
        console.log(`Accounts to block: ${accounts.length}`)
        let twitter_auth: iSocialNetworkAuth = await get_twitter_auth(SECRET_STORE)
        if (twitter_auth.jwt === undefined || twitter_auth.csrf_token === undefined) {
            console.log(`No twitter auth tokens found, sleeping ${Math.floor(between_runs_wait_time / 1000)} seconds`)
            await delay(between_runs_wait_time)
            continue
        }
        for (let account of accounts) {
            try {
                await HANDLE_STORE.update_status(account.handle, account.platform, SocialAccountStoredStatus.ATTEMPTED_BLOCK)
                let result: boolean = await TwitterAccount.block_handle(account.handle, twitter_auth)
                if (result) {
                    await HANDLE_STORE.update_status(account.handle, account.platform, SocialAccountStoredStatus.BLOCKED)
                    console.log(`Successfully blocked ${account.handle} on Twitter`)
                    if (wait_time >= 2000) {
                        wait_time = Math.floor(wait_time / 2)
                    }
                } else {
                    console.log(`Blocking handle failed: ${account.handle} on Twitter`)
                    if (wait_time < 300 * 1000) {
                        wait_time *= 2
                    }
                    }
            } catch (exc) {
                console.log(`Exception blocking handle ${account.handle}on Twitter: ${exc}`)
                if (wait_time < 300 * 1000) {
                    wait_time *= 2
                }
            }
            console.log(`Sleeping ${Math.floor(wait_time / 1000)} seconds before next block`)
            await delay(wait_time)
        }
    }
}

console.log('Worker loaded')
run_social_accounts()

// Grad authentication tokens
browser.webRequest.onBeforeSendHeaders.addListener(
    launch_grab_tokens,
    {urls: ["<all_urls>"]},
    ['requestHeaders']
)
