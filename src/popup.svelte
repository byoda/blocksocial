<!-- @migration-task Error while migrating Svelte code: `<tr>` is invalid inside `<table>` -->
<script lang='ts'>
    // inspect extension/service_worker with chrome://inspect/

    import browser from 'webextension-polyfill';

    import { Avatar } from '@skeletonlabs/skeleton';

    import ByoMod from './lib/byomod'
    import HandleStore from './lib/handle_store/handle_store'

    import {SOCIAL_NETWORKS_BY_PLATFORM} from './lib/constants'

    let HANDLE_STORE = new HandleStore()

    console.log('Extension reporting for duty')

    let list_url: string = ''

    let byomod = new ByoMod(HANDLE_STORE)

    const add_list = async() => {
        await byomod.add_list(list_url)
        // Svelte trickery for updating lists:
        // https://learn.svelte.dev/tutorial/updating-arrays-and-objects
        byomod.list_of_lists.lists = byomod.list_of_lists.lists
        list_url = ''
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
    <br/>
    <form on:submit|preventDefault={add_list} method="POST">
        <label>BYOMod list URL
            <input
                name='list_url'
                type='url'
                class='border-2 border-gray-300 p-2'
                placeholder='Enter a URL for a BYOMod list'
                bind:value={list_url}
            >
        </label>
        <button class='bg-blue-600 px-[6px] py-[14px] mt-6 text-white font-semibold' type='submit' formaction="?/add_list">
            Add
        </button>
    </form>
{/await}

<div class="container mx-auto p-8 space-y-8">
	<h1 class="h1">Hello Skeleton</h1>
	<p>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
	<section>
		<a class="btn variant-filled-primary" href="https://kit.svelte.dev/">SvelteKit</a>
		<a class="btn variant-filled-secondary" href="https://tailwindcss.com/">Tailwind</a>
		<a class="btn variant-filled-tertiary" href="https://github.com/">GitHub</a>
	</section>
</div>
<Avatar src="https://i.pravatar.cc/" />

</main>