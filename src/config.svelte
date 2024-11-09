<script lang='ts'>

    import {TableHandler, Datatable, ThSort, ThFilter } from '@vincjo/datatables';

    import ByoMod from './lib/byomod'
    import HandleStore from './lib/handle_store/handle_store'
    import type {iListStat} from './lib/datatypes'

    import {LIST_OF_LISTS_URL} from './lib/constants'

    let HANDLE_STORE = new HandleStore()

    console.log('Config page reporting for duty')

    let list_url: string = ''

    let byomod = new ByoMod(HANDLE_STORE)
    let table: TableHandler

    const get_lists = async() => {
        const lists: Map<string, iListStat> = await byomod.download_list_of_lists(LIST_OF_LISTS_URL)
        table = new TableHandler(lists.values().toArray(), {rowsPerPage: 10})
        return lists.values().toArray()
    }

    const subscribe = async(url: string) => {
        // let url = 'https://byomod.org/lists/test-6.yaml'
        console.log(`Subscribing to ${url}`)
        await byomod.add_list(url)
        // Svelte trickery for updating lists:
        // https://learn.svelte.dev/tutorial/updating-arrays-and-objects
        byomod.subscribed_lists = byomod.subscribed_lists

        for (let list of byomod.list_of_lists.values()) {
                if (list.url == url) {
                    list.subscribed = true
                    break
                }
            }
    }

    const unsubscribe = async(url: string) => {
        console.log(`Unsubscribing from ${url}`)
        await byomod.remove_list(url)
        // Svelte trickery for updating lists:
        // https://learn.svelte.dev/tutorial/updating-arrays-and-objects
        byomod.subscribed_lists = byomod.subscribed_lists
        for (let list of byomod.list_of_lists.values()) {
            if (list.url == url) {
                list.subscribed = false
                break
            }
        }
    }


    const add_list = async() => {
        await byomod.add_list(list_url)
        // Svelte trickery for updating lists:
        // https://learn.svelte.dev/tutorial/updating-arrays-and-objects
        byomod.subscribed_lists = byomod.subscribed_lists
        list_url = ''
    }

</script>
<h2>Public Lists</h2>
<div class='container mx-auto px-0 text-sm'>
{#await get_lists()}
    <p>Loading unsubscribed lists...</p>
{:then all_lists}
    <Datatable {table}>
        <table>
            <thead>
                <tr>
                    <th>List</th>
                    <th><img src='images/twitter-icon.png' alt='twitter icon' height='40' width='40'/></th>
                    <th><img src='images/youtube-icon.png' alt='youtube icon' height='40' width='40'/></th>
                    <th><img src='images/tiktok-icon.png' alt='tiktok icon' height='40' width='40'/></th>
                    <th>Action</th>
                    <th>Categories</th>
                </tr>
            </thead>
            <tbody>
    {#each table.rows as row}
                    <tr>
                        <td style='width:50%'><a href='/listview.html?list={row.url}'>{row.name}</a></td>
                        <td style='width:10%'>{row.counters.get('twitter')}</td>
                        <td style='width:10%'>{row.counters.get('youtube')}</td>
                        <td style='width:10%'>{row.counters.get('tiktok')}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
        {#if row.subscribed == false}
                            <button type="button" on:click={() => subscribe(row.url)} class="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-gray-50 text-grey-800 hover:text-grey-800 focus:outline-none focus:text-blue-800 disabled:opacity-50 disabled:pointer-events-none dark:text-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400">Apply</button>
        {:else}
                            <button type="button" on:click={() => unsubscribe(row.url)} class="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-gray-50 text-grey-800 hover:text-grey-800 focus:outline-none focus:text-blue-800 disabled:opacity-50 disabled:pointer-events-none dark:text-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400">Cancel</button>
        {/if}
                        </td>
                        <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 20ch;">
                            {row.categories.toString()}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </Datatable>
{/await}
<br/>
<form on:submit|preventDefault={add_list} method="POST">
    <label>Add Private List
        <input
            name='list_url'
            type='url'
            class='border-2 border-gray-300 p-2'
            placeholder='Enter a URL for a BYOMod list'
            bind:value={list_url}
        >
        <button  type='submit' formaction='?/add_list' class='bg-blue-600 px-[6px] py-[14px] mt-6 text-white font-semibold'>
            Add
        </button>
    </label>
</form>

</div>
