<script lang='ts'>
    import { TableHandler } from '@vincjo/datatables';

    import ByoMod from '../byomod'
    import HandleStore from '../handle_store/handle_store'

    let HANDLE_STORE = new HandleStore()

    let byomod = new ByoMod(HANDLE_STORE)

    const table = new TableHandler(byomod.lists.values().toArray(), {rowsPerPage: 5 });
    const rows = handler.getRows();
</script>