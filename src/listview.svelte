<script lang='ts'>
    import {TableHandler, Datatable, ThSort, ThFilter } from '@vincjo/datatables';

    import BlockList from './lib/list'
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
        return block_list.block_entries
    }
</script>
<h1>List Metadata</h1>
<div class='container mx-auto px-4 text-sm content-normal'>
{#await get_list()}
    <p>Loading list {url}...</p>
{:then block_list}

    <table >
        <thead>
            <tr>
                <th>List</th>
                <td>{block_list.list.meta.list_name}</td>
            </tr>
            <tr>
                <th>Last updated</th>
                <td>{block_list.list.meta.last_updated}</td>
            </tr>
            <tr>
                <th>Entries</th>
                <td>{block_list.block_entries.length}</td>
            </tr>
            <tr>
                <th>Author</th>
                <td>{block_list.list.meta.author_name}</td>
            </tr>
            <tr>
                <th>Email</th>
                <td>{block_list.list.meta.author_email}</td>
            </tr>
            <tr>
                <th>Author URL</th>
                <td>{block_list.list.meta.author_url}</td>
            </tr>
            <tr>
                <th>List URL</th>
                <td>{block_list.list.meta.download_url}</td>
            </tr>
            <tr>
                <th>Categories</th>
                <td>

                </td>
            </tr>
        </thead>
    </table>
<h1>Categories used in the list</h1>
    <table>
        <thead>
    {#each block_list.categories as category}
            <tr>
                <th >{category[0]}</th>
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
                </tr>
{/each}
            </tbody>
        </table>
    </Datatable>
    {/await}
</div>

