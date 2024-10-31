<script lang='ts'>
    import {TableHandler, Datatable, ThSort, ThFilter } from '@vincjo/datatables';

    import ByoList from './lib/list'
    import type { iByoListCategory } from './lib/datatypes';


    let url: string = ''
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('list')) {
        url = urlParams.get('list')
        console.log(url)
    } else {
        window.location.href = '/index.html'
    }
    console.log('ListView reporting for duty')
    let byo_list: ByoList
    let table: TableHandler
    const get_list = async() => {
        console.log(`Downloading list ${url}`)
        byo_list = new ByoList(url)
        await byo_list.download()
        table = new TableHandler(byo_list.list.block_list, {rowsPerPage: 30})
        return byo_list.list.block_list
    }
</script>
<h1>List Details</h1>
<div class='container mx-auto px-4 '>
{#await get_list()}
    <p>Loading list {url}...</p>
{:then all_lists}
    <table>
        <thead>
            <tr>
                <th>List</th>
                <td>{byo_list.list.meta.list_name}</td>
            </tr>
            <tr>
                <th>Last updated</th>
                <td>{byo_list.list.meta.last_updated}</td>
            </tr>
            <tr>
                <th>Author</th>
                <td>{byo_list.list.meta.author_name}</td>
            </tr>
            <tr>
                <th>Email</th>
                <td>{byo_list.list.meta.author_email}</td>
            </tr>
            <tr>
                <th>Author URL</th>
                <td>{byo_list.list.meta.author_url}</td>
            </tr>
            <tr>
                <th>List URL</th>
                <td>{byo_list.list.meta.download_url}</td>
            </tr>
            <tr>
                <th>Categories</th>
                <td>
                    <table>
                        <thead>
{#each byo_list.list.meta.categories as category}
                            <tr>
                                <th>{category.name}</th>
                                <td>{category.description}</td>
                            </tr>
{/each}
                        </thead>
                    </table>
                </td>
            </tr>
        </thead>
    </table>
    <!-- <Datatable {table}>
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
                        <td style='width:50%'>{row.name}</td>
                        <td style='width:5%'>{row.counters['twitter']}</td>
                        <td style='width:5%'>{row.counters['youtube']}</td>
                        <td style='width:5%'>{row.counters['tiktok'] || 0}</td>
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
    </Datatable> -->
{/await}
</div>
