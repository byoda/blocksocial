<script lang='ts'>
    import Modal from './components/Modal.svelte'
    import {TableHandler, Datatable, ThSort, ThFilter } from '@vincjo/datatables';

    import ByoMod from './lib/byomod'
    import HandleStore from './lib/handle_store/handle_store'
    import type {iListOfLists, iListStat} from './lib/datatypes'

    import {SOCIAL_NETWORKS_BY_PLATFORM} from './lib/constants'
    import {LIST_OF_LISTS_URL} from './lib/constants'

    let HANDLE_STORE = new HandleStore()

    console.log('Extension reporting for duty')

    let list_url: string = ''

    let byomod = new ByoMod(HANDLE_STORE)
    let table: TableHandler

    const get_lists = async() => {
        const lists: Map<string, iListStat> = await byomod.download_list_of_lists(LIST_OF_LISTS_URL)
        table = new TableHandler(lists.values().toArray(), {rowsPerPage: 10})
        return lists.values().toArray()
    }

    function subscribe(url: string) {
        console.log(`Subscribing to ${url}`)
        // return async() => {
        //     await byomod.add_list(url)
        //     // Svelte trickery for updating lists:
        //     // https://learn.svelte.dev/tutorial/updating-arrays-and-objects
        //     byomod.subscribed_lists.lists = byomod.subscribed_lists.lists
        // }
        for (let list of byomod.list_of_lists.values()) {
            if (list.url == url) {
                list.subscribed = true
                break
            }
        }
    }
    function unsubscribe(url: string) {
        console.log(`Unsubscribing from ${url}`)
        // return async() => {
        //     await byomod.add_list(url)
        //     // Svelte trickery for updating lists:
        //     // https://learn.svelte.dev/tutorial/updating-arrays-and-objects
        //     byomod.subscribed_lists.lists = byomod.subscribed_lists.lists
        // }
        for (let list of byomod.list_of_lists.values()) {
            if (list.url == url) {
                list.subscribed = false
                break
            }
        }
    }

</script>
<h2>Available Lists</h2>
<div class='container mx-auto px-0 '>
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
                    <th>Subscribe</th>
                    <th>Unsubscribe</th>
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
                            <button type="button" on:click={() => subscribe(row.url)} class="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-gray-50 text-grey-800 hover:text-grey-800 focus:outline-none focus:text-blue-800 disabled:opacity-50 disabled:pointer-events-none dark:text-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400">Subscribe</button>
{/if}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
{#if row.subscribed == true}
                            <button type="button" on:click={() => unsubscribe(row.url)} class="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-gray-50 text-grey-800 hover:text-grey-800 focus:outline-none focus:text-blue-800 disabled:opacity-50 disabled:pointer-events-none dark:text-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400">Unsubscribe</button>
{/if}
                        </td>
                        <td>{row.categories.toString()}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </Datatable>
{/await}
</div>
