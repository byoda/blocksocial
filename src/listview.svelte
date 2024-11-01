<script lang='ts'>
    import {TableHandler, Datatable, ThSort, ThFilter } from '@vincjo/datatables';

    import ByoList from './lib/list'
    import BlockEntry from './lib/blockentry'

    let url: string = ''
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('list')) {
        url = urlParams.get('list')
    } else {
        window.location.href = '/index.html'
    }
    console.log('ListView reporting for duty')
    let byo_list: ByoList
    let block_entry: BlockEntry
    let table: TableHandler
    const get_list = async() => {
        console.log(`Downloading list ${url}`)
        byo_list = new ByoList(url)
        await byo_list.initialize()
        table = new TableHandler(byo_list.block_entries, {rowsPerPage: 30})
        return byo_list.block_entries
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
                <td>{byo_list.list.meta.list_name}</td>
            </tr>
            <tr>
                <th>Last updated</th>
                <td>{byo_list.list.meta.last_updated}</td>
            </tr>
            <tr>
                <th>Entries</th>
                <td>{byo_list.block_entries.length}</td>
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

                </td>
            </tr>
        </thead>
    </table>
<h1>Categories used in the list</h1>
    <table>
        <thead>
    {#each byo_list.categories as category}
            <tr>
                <th >{category[0]}</th>
                <td>{category[1]}</td>
            </tr>
    {/each}
        </thead>
    </table>
    <Datatable {table}>
        <table>
            <thead>
                <tr>
                    <th>First name</th>
                    <th>Last name</th>
                    <th>Business name</th>
                    <th>Business type</th>
                    <th>Languages</th>
                    <th>Categories</th>
                    <th>Twitter</th>
                    <th>YouTube</th>
                    <th>TikTok</th>
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

