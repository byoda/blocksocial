/*
/* This module is currently not used
*/

import browser from 'webextension-polyfill';


import type {iSocialNetworkAuth} from './datatypes'

import HandleStore from '../lib/handle_store/handle_store'

export default class Message {
    public static async send(
            source: string, type: string, data: any,
            tab: chrome.tabs.Tab | undefined = undefined): Promise<boolean> {

        let message = {
            source: source,
            type: type,
            data: data
        }
        let serialized_message: string = JSON.stringify(message)
        try {
            await chrome.runtime.sendMessage(serialized_message)
            console.log(`Sent message to extension: ${serialized_message}`)
        } catch (e) {
            console.log(`Failed to send message to extension: ${e} -> ${serialized_message}`)
            return false
        }
        if (tab === undefined) {
            return false
        } else {
            try {
                await chrome.tabs.sendMessage(tab!['id']!, serialized_message)
                return true
            } catch (e) {
                console.log(`Failed to send message to tab: ${e} -> ${serialized_message}`)
                return false
            }
        }
    }

    public static setup_listen(handle_store: HandleStore): Function | undefined {

                try {
                    let message: iMessage<any> = JSON.parse(request) as iMessage<any>
                    if (message.type === 'auth_tokens') {
                        console.log('Received auth_tokens message')
                        save_auth_tokens(message as iMessage<iSocialNetworkAuth>)
                    } else if (message.type === 'social_accounts_push') {
                    }
                } catch (e) {
                    console.log(`Invalid message: ${request}: ${e}`)
                }
            }
        )
        return undefined
    }

    public static get_extension_id(): string {
        return chrome.runtime.id
    }
}


function save_auth_tokens(message: iMessage<iSocialNetworkAuth>) {
    console.log(`Received auth_tokens: ${message.source}:${message.type}`)
    let payload: iSocialNetworkAuth
    if (typeof message.data === 'string') {
        payload = JSON.parse(message.data) as iSocialNetworkAuth
    } else {
        payload = message.data as iSocialNetworkAuth
    }
    if (payload.name != 'Twitter') {
        console.log(
            `We do not yet support social network: ${payload.name}`
        )
        return
    }
    console.log(
        `Received auth_tokens: JWT: ${payload.jwt}, CSRF Token: ${payload.csrf_token}`
    )
    localStorage.setItem(
        'auth_tokens_twitter', JSON.stringify(payload)
    )

}

export async function load_auth_tokens(): Promise<iSocialNetworkAuth | undefined> {
    let data_text: string | null = localStorage.getItem('auth_tokens_twitter')
    if (data_text == null) {
        console.log('No auth tokens found!')
        return undefined
    }
    let data = JSON.parse(data_text) as iSocialNetworkAuth
    return data
}
