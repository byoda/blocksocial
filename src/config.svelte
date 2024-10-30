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
    let subscribed_table: TableHandler

    const get_unsubscribed_lists = async() => {
        const unsubscribed_lists: Map<string, iListStat> = await byomod.get_unsubscribed_lists()
        console.log(`Unsubscribed lists: ${unsubscribed_lists.size}`)
        table = new TableHandler(unsubscribed_lists.values().toArray(), {rowsPerPage: 5})
        return unsubscribed_lists
    }

    const get_subscribed_lists = async() => {
        const subscribed_lists: Map<string, iListStat> = await byomod.get_subscribed_lists()
        console.log(`Subscribed lists: ${subscribed_lists.size}`)
        subscribed_table = new TableHandler(subscribed_lists.values().toArray(), {rowsPerPage: 5})
        return subscribed_lists
    }

    function subscribe(url: string) {
        console.log(`Subscribing to ${url}`)
        // return async() => {
        //     await byomod.add_list(url)
        //     // Svelte trickery for updating lists:
        //     // https://learn.svelte.dev/tutorial/updating-arrays-and-objects
        //     byomod.subscribed_lists.lists = byomod.subscribed_lists.lists
        // }
    }

</script>
<h2>Available Lists</h2>
<div class='container mx-auto px-4 min-w-full'>
    {#await get_unsubscribed_lists()}
        <p>Loading unsubscribed lists...</p>
    {:then unsubscribed_lists}
        {#if unsubscribed_lists}
        <Datatable {table}>
            <table >
                <thead>
                    <tr>
                        <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">List</th>
                        <th><img src='images/twitter-icon.png' alt='twitter icon' height='40' width='40'/></th>
                        <th><img src='images/youtube-icon.png' alt='youtube icon' height='40' width='40'/></th>
                        <th><img src='images/tiktok-icon.png' alt='tiktok icon' height='40' width='40'/></th>
                        <th>Subscribe</th>
                    </tr>
                </thead>
                <tbody>
                    {#each table.rows as row}
                        <tr>
                            <td style='width:70%'>{row.name}</td>
                            <td>{row.counters['twitter']}</td>
                            <td>{row.counters['youtube']}</td>
                            <td>{row.counters['tiktok'] || 0}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                                <button type="button" on:click={() => subscribe(row.url)} class="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-gray-50 text-grey-800 hover:text-grey-800 focus:outline-none focus:text-blue-800 disabled:opacity-50 disabled:pointer-events-none dark:text-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400">Subscribe</button>
                              </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </Datatable>
        {/if}
    {/await}
</div>
<h2>Subscribed Lists</h2>
<div class='container mx-auto px-4 min-w-full'>
    {#await get_unsubscribed_lists()}
        <p>Loading subscribed lists...</p>
    {:then subscribed_lists}
        {#if subscribed_lists}
        <Datatable {table}>
            <table >
                <thead>
                    <tr>
                        <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">List</th>
                        <th><img src='images/twitter-icon.png' alt='twitter icon' height='40' width='40'/></th>
                        <th><img src='images/youtube-icon.png' alt='youtube icon' height='40' width='40'/></th>
                        <th><img src='images/tiktok-icon.png' alt='tiktok icon' height='40' width='40'/></th>
                        <th>Subscribe</th>
                    </tr>
                </thead>
                <tbody>
                    {#each table.rows as row}
                        <tr>
                            <td style='width:70%'>{row.name}</td>
                            <td>{row.counters['twitter']}</td>
                            <td>{row.counters['youtube']}</td>
                            <td>{row.counters['tiktok'] || 0}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                                <button type="button" on:click={() => subscribe(row.url)} class="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-gray-50 text-grey-800 hover:text-grey-800 focus:outline-none focus:text-blue-800 disabled:opacity-50 disabled:pointer-events-none dark:text-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400">Subscribe</button>
                              </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </Datatable>
        {/if}
    {/await}
</div>