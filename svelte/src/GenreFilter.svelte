<script lang="ts">
    import { Writable } from "svelte/store";
    export let value: Writable<string[]>;
    export let genres: string[];
    export let label: string = "Genres";

    let searchQuery = "";
    let isExpanded = true;

    $: filteredGenres = genres.filter((g) =>
        g.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    function toggleGenre(genre: string) {
        if ($value.includes(genre)) {
            $value = $value.filter((g) => g !== genre);
        } else {
            $value = [...$value, genre];
        }
    }

    function toggleFiltered() {
        if (filteredGenres.length === 0) return;
        const allFilteredSelected = filteredGenres.every((g) => $value.includes(g));
        if (allFilteredSelected) {
            $value = $value.filter((g) => !filteredGenres.includes(g));
        } else {
            $value = Array.from(new Set([...$value, ...filteredGenres]));
        }
    }

    $: allFilteredSelected =
        filteredGenres.length > 0 &&
        filteredGenres.every((g) => $value.includes(g));

    function clearAll() {
        $value = [];
    }

    function toggleOpen() {
        isExpanded = !isExpanded;
    }
</script>

<div class="setting-item mod-genre">
    <div class="header-row" on:click={toggleOpen}>
        <div class="title-section">
            <i class="fa fa-caret-{isExpanded ? 'down' : 'right'} caret" />
            <span class="label-text">{label}</span>
            {#if $value.length > 0}
                <span class="badge">{$value.length} selected</span>
            {/if}
        </div>
        {#if $value.length > 0}
            <button class="clear-btn" on:click|stopPropagation={clearAll}>Clear</button>
        {/if}
    </div>

    {#if isExpanded}
        <div class="expanded-panel">
            <div class="controls-row">
                <div class="search-box">
                    <i class="fa fa-search search-icon" />
                    <input
                        type="text"
                        placeholder="Search genres & themes..."
                        bind:value={searchQuery}
                        class="genre-search-input"
                    />
                    {#if searchQuery}
                        <button class="clear-search" on:click={() => (searchQuery = "")}>
                            <i class="fa fa-times" />
                        </button>
                    {/if}
                </div>
                <button class="select-all-btn" on:click={toggleFiltered}>
                    {allFilteredSelected ? "Deselect All" : "Select All"}
                </button>
            </div>

            <div class="genre-list">
                {#each filteredGenres as genre}
                    <label class="genre-checkbox-label">
                        <input
                            type="checkbox"
                            checked={$value.includes(genre)}
                            on:change={() => toggleGenre(genre)}
                        />
                        <span class="genre-name">{genre}</span>
                    </label>
                {:else}
                    <div class="no-results">No genres match "{searchQuery}"</div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .setting-item {
        border-top: 1px solid var(--background-modifier-border);
        padding-top: var(--scale-8-1);
        padding-bottom: var(--scale-8-1);
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        user-select: none;
        padding: 4px 0;
    }

    .title-section {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: var(--color-d-gray-10);
    }

    .caret {
        width: 14px;
        margin-right: 6px;
        color: var(--color-d-gray-20);
    }

    .label-text {
        font-weight: 500;
    }

    .badge {
        background-color: #ff66a5;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 10px;
        margin-left: 8px;
    }

    .clear-btn {
        background: none;
        border: none;
        color: #ff66a5;
        font-size: 11px;
        cursor: pointer;
        padding: 2px 6px;
    }

    .clear-btn:hover {
        text-decoration: underline;
    }

    .expanded-panel {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .controls-row {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .search-box {
        position: relative;
        flex: 1;
    }

    .select-all-btn {
        background-color: #2a2b36;
        border: 1px solid var(--background-modifier-border);
        color: #aaa;
        font-size: 10px;
        padding: 6px 8px;
        border-radius: 5px;
        cursor: pointer;
        white-space: nowrap;
    }

    .select-all-btn:hover {
        color: #fff;
        background-color: #353745;
    }

    .search-icon {
        position: absolute;
        left: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 11px;
        color: #888;
        pointer-events: none;
    }

    .genre-search-input {
        width: 100%;
        box-sizing: border-box;
        padding: 6px 26px 6px 26px;
        border-radius: 5px;
        border: 1px solid var(--background-modifier-border);
        background-color: #2a2b36;
        color: #eee;
        font-size: 12px;
        outline: none;
    }

    .genre-search-input:focus {
        border-color: #ff66a5;
    }

    .clear-search {
        position: absolute;
        right: 6px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
        font-size: 11px;
    }

    .genre-list {
        max-height: 190px;
        overflow-y: auto;
        background-color: #1e1f29;
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        padding: 4px 6px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .genre-checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 6px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        color: #ddd;
        user-select: none;
    }

    .genre-checkbox-label:hover {
        background-color: #2b2d3d;
    }

    .genre-checkbox-label input[type="checkbox"] {
        accent-color: #ff66a5;
        cursor: pointer;
        width: 14px;
        height: 14px;
        margin: 0;
    }

    .no-results {
        padding: 10px;
        text-align: center;
        font-size: 12px;
        color: #888;
    }
</style>
