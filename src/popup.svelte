<script lang='ts'>
    import browser from 'webextension-polyfill';

    import Button from "./Button.svelte"

    import type { PopupSettings } from '@skeletonlabs/skeleton';

    import ByoMod from './lib/byomod'
    import HandleStore from './lib/handle_store/handle_store'

    import {SOCIAL_NETWORKS_BY_PLATFORM} from './lib/constants'

    let HANDLE_STORE = new HandleStore()

    console.log('Popup reporting for duty')

    let list_url: string = ''

    let byomod = new ByoMod(HANDLE_STORE)

    const popupFeatured: PopupSettings = {
        event: 'click',
        target: 'real_popup',
        placement: 'bottom-start',
    }


    browser.runtime.onMessage.addListener(
        (message, sender, sendResponse) => {
            console.log('Message received:', message);
            // sendResponse({status: 'received'});
            return true;
        }
    );

</script>
<main class='flex flex-col justify-left items-center'>
    <br/>
{#await byomod.load_handles()}
    <p>Loading blocks...</p>
{:then found_net_with_handles}
    {#if found_net_with_handles}
        <table>
            <thead>
                <tr>
                    <th>Platform</th>
                    <th>Handles</th>
                    <th>Blocked</th>
                </tr>
            </thead>
            <tbody>
                {#each SOCIAL_NETWORKS_BY_PLATFORM.values() as net}
                    {#if net !== undefined && net.blocked_handles !== undefined && net.blocked_handles.size > 0}
                        <tr>
                            <td>{net.name}</td>
                            <td>{net.all_handles.size}</td>
                            <td>{net.blocked_handles.size}</td>
                        </tr>
                    {/if}
                {/each}
            </tbody>
        </table>
    {/if}
{/await}

<br/>

{#await byomod.load_lists()}
    <p>Loading lists...</p>
    {:then lists}
        {#if lists && lists.size > 0}
            <table>
                <thead>
                    <tr>

                        <th>Configured Lists</th>
                        <th>Blocks</th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {#each lists.keys() as list_url}
                        <tr>
                            <td>{lists.get(list_url).list.meta.list_name}</td>
                            <td>{lists.get(list_url).list.block_list.length}</td>
                        </tr>
                    {/each}
            </table>
        {:else}
            <br/>
            <p>No lists configured</p>
        {/if}
{/await}
<br/>
<Button class="danger lg" on:click={()=>console.log("Clicked")}>
	<a href="/index.html" target='_blank'>Configure lists</a>
</Button>
Hello, world!
</main>