<script lang='ts'>
    import {TableHandler, Datatable, ThSort, ThFilter } from '@vincjo/datatables';

    import BlockList from './lib/blocklist'
    import BlockEntry from './lib/blockentry'

    let url: string = ''
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('list')) {
        url = urlParams.get('list')
    } else {
        window.location.href = '/index.html'
    }
    console.log('ListView reporting for duty')
    let block_list: BlockList
    let block_entry: BlockEntry
    let table: TableHandler
    const get_list = async() => {
        console.log(`Downloading list ${url}`)
        block_list = new BlockList(url)
        await block_list.initialize()
        table = new TableHandler(block_list.block_entries, {rowsPerPage: 30})
        return block_list
    }

    const block = async(handle: string) => {
        console.log(`Subscribing to ${url}`)
        // await byomod.block('twitter', handle)
        // Svelte trickery for updating lists:
        // https://learn.svelte.dev/tutorial/updating-arrays-and-objects
        // byomod.subscribed_lists = byomod.subscribed_lists

        for (let list of byomod.list_of_lists.values()) {
                if (list.url == url) {
                    list.subscribed = true
                    break
                }
            }
    }
</script>
<h1>List Metadata</h1>
<div class='container mx-auto px-4 text-sm content-normal text-left'>
{#await get_list()}
    <p>Loading list {url}...</p>
{:then block_list: BlockList}

    <table >
        <thead>
            <tr>
                <th>List</th>
                <td>{block_list.list_name}</td>
            </tr>
            <tr>
                <th>Last updated</th>
                <td>{block_list.last_updated}</td>
            </tr>
            <tr>
                <th>Entries</th>
                <td>{block_list.block_entries.length}</td>
            </tr>
            <tr>
                <th>Author</th>
                <td>{block_list.author_name}</td>
            </tr>
            <tr>
                <th>Email</th>
                <td>{block_list.author_email}</td>
            </tr>
            <tr>
                <th>Author URL</th>
                <td>{block_list.author_url}</td>
            </tr>
            <tr>
                <th>List URL</th>
                <td>{block_list.download_url}</td>
            </tr>
        </thead>
    </table>
    <br/>
    <h1>Categories used in the list</h1>
    <br/>
    <table>
        <thead>
    {#each block_list.categories as category}
            <tr>
                <th>{category[0]}</th>
                <td>{category[1]}</td>
            </tr>
    {/each}
        </thead>
    </table>
    <Datatable basic {table}>
        <table>
            <thead>
                <tr>
                    <ThSort {table} field="first_name">First name</ThSort>
                    <ThSort {table} field="last_name">Last name</ThSort>
                    <ThSort {table} field=">business_name">Business</ThSort>
                    <ThSort {table} field="business_type">Business type</ThSort>
                    <th>Languages</th>
                    <th>Categories</th>
                    <ThSort {table} field="twitter">Twitter</ThSort>
                    <ThSort {table} field="youtube">YouTube</ThSort>
                    <ThSort {table} field="tiktok">TikTok</ThSort>
                    <th>Block</th>
                </tr>
                <tr>
                    <ThFilter {table} field='first_name' />
                    <ThFilter {table} field='last_name' />
                    <ThFilter {table} field='business_name' />
                    <ThFilter {table} field='business_type' />
                    <th></th>
                    <th></th>
                    <ThFilter {table} field='twitter' />
                    <ThFilter {table} field='youtube' />
                    <ThFilter {table} field='tiktok' />
                    <th></th>
                </tr>
            </thead>
            <tbody>
{#each table.rows as block_entry}
                <tr>
                    <td>{block_entry.first_name || '-'}</td>
                    <td>{block_entry.last_name || '-'}</td>
                    <td>{block_entry.business_name || '-'}</td>
                    <td>{block_entry.business_type || '-'}</td>
                    <td>{block_entry.languages.toString() || '-'}</td>
                    <td>{block_entry.categories.toString()  || '-'}</td>
                    <td>
{#if block_entry.twitter_handle}
                        <a href='https://x.com/{block_entry.twitter_handle}' target=_blank>{block_entry.twitter_handle}</a>
{:else}
                        -
{/if}
                    </td>
                    <td>
{#if block_entry.youtube_handle}
                        <a href='https://youtube.com/@{block_entry.youtube_handle}' target=_blank>{block_entry.youtube_handle}</a>
{:else}
                        -
{/if}
                    </td>
                    <td>
{#if block_entry.tiktok_handle}
                        <a href='https://youtube.com/{block_entry.tiktok_handle}' target=_blank>{block_entry.tiktok_handle}</a>
{:else}
                        -
{/if}
                    </td>
                    <td>
                        <button type="button" on:click={() => apply(block_entry.twitter_handle)} class="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-gray-50 text-grey-800 hover:text-grey-800 focus:outline-none focus:text-blue-800 disabled:opacity-50 disabled:pointer-events-none dark:text-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400">Block</button>

                    </td>
                </tr>
{/each}
            </tbody>
        </table>
    </Datatable>
{/await}
</div>