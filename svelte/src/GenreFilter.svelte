<script lang="ts">
    import { Writable } from "svelte/store";
    export let value: Writable<string>;
    export let genres: string[];
    export let label: string = "Genre / Theme";
</script>

<div class="setting-item mod-genre">
    <div class="setting-item-info">
        {label}: {$value || "All"}
    </div>
    <div class="select-wrapper">
        <select bind:value={$value} class="genre-dropdown">
            <option value="">All ({genres.length} tags)</option>
            {#each genres as genre}
                <option value={genre}>{genre}</option>
            {/each}
        </select>
        <i class="fa fa-chevron-down dropdown-arrow" />
    </div>
</div>

<style>
    .setting-item {
        align-items: center;
        border-top: 1px solid var(--background-modifier-border);
        padding-top: var(--scale-8-1);
        padding-bottom: var(--scale-8-1);
        margin-right: 0;
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .setting-item-info {
        flex: 1 1 auto;
        width: 100%;
        margin-bottom: 8px;
        font-size: 14px;
        color: var(--color-d-gray-10);
    }

    .select-wrapper {
        position: relative;
        width: 100%;
    }

    .genre-dropdown {
        width: 100%;
        padding: 8px 30px 8px 12px;
        border-radius: 6px;
        border: 1px solid var(--background-modifier-border);
        background-color: #2a2b36;
        color: #eee;
        font-size: 13px;
        outline: none;
        appearance: none;
        -webkit-appearance: none;
        cursor: pointer;
    }

    .genre-dropdown:focus {
        border-color: #ff66a5;
    }

    .dropdown-arrow {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        font-size: 11px;
        color: #aaa;
    }
</style>
