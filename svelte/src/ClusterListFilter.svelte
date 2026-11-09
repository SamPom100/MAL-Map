<script lang="ts">
    import { Writable } from "svelte/store";
    import { CLUSTER_NAMES } from "./ts/cluster_names";

    export let pinned: Writable<string[]>;
    export let clusterCounts: { [hueKey: string]: number } = {};
    export let label: string = "Cluster Categories";

    let isExpanded = true;
    let searchQuery = "";

    function hslToHex(h: number, s: number, l: number): string {
        l /= 100;
        const a = (s * Math.min(l, 1 - l)) / 100;
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color)
                .toString(16)
                .padStart(2, "0");
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    interface ClusterItem {
        key: string;
        hue: number;
        name: string;
        color: string;
        count: number;
    }

    $: clusters = Object.entries(CLUSTER_NAMES)
        .map(([key, name]) => {
            const hue = parseFloat(key);
            return {
                key,
                hue,
                name,
                color: hslToHex(hue, 75, 60),
                count: clusterCounts[key] || 0,
            } as ClusterItem;
        })
        .sort((a, b) => a.hue - b.hue);

    $: filteredClusters = clusters.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    function toggleCluster(key: string) {
        if ($pinned.includes(key)) {
            $pinned = $pinned.filter((k) => k !== key);
        } else {
            $pinned = [...$pinned, key];
        }
    }

    function toggleFiltered() {
        const targetKeys = filteredClusters.map((c) => c.key);
        if (targetKeys.length === 0) return;
        const allFilteredSelected = targetKeys.every((k) => $pinned.includes(k));
        if (allFilteredSelected) {
            $pinned = $pinned.filter((k) => !targetKeys.includes(k));
        } else {
            $pinned = Array.from(new Set([...$pinned, ...targetKeys]));
        }
    }

    $: allFilteredSelected =
        filteredClusters.length > 0 &&
        filteredClusters.every((c) => $pinned.includes(c.key));

    function clearAll() {
        $pinned = [];
    }

    function toggleOpen() {
        isExpanded = !isExpanded;
    }
</script>

<div class="setting-item mod-clusters">
    <div class="header-row" on:click={toggleOpen}>
        <div class="title-section">
            <i class="fa fa-caret-{isExpanded ? 'down' : 'right'} caret" />
            <span class="label-text">{label}</span>
            {#if $pinned.length > 0}
                <span class="badge">{$pinned.length} pinned</span>
            {/if}
        </div>
        {#if $pinned.length > 0}
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
                        placeholder="Search clusters..."
                        bind:value={searchQuery}
                        class="cluster-search-input"
                    />
                    {#if searchQuery}
                        <button
                            class="clear-search"
                            on:click={() => (searchQuery = "")}
                        >
                            <i class="fa fa-times" />
                        </button>
                    {/if}
                </div>
                <button class="select-all-btn" on:click={toggleFiltered}>
                    {allFilteredSelected ? "Deselect All" : "Select All"}
                </button>
            </div>

            <div class="cluster-list">
                {#each filteredClusters as cluster}
                    <label class="cluster-checkbox-label">
                        <input
                            type="checkbox"
                            checked={$pinned.includes(cluster.key)}
                            on:change={() => toggleCluster(cluster.key)}
                        />
                        <span
                            class="color-dot"
                            style="background-color: {cluster.color};"
                        />
                        <span class="cluster-name" title={cluster.name}>
                            {cluster.name}
                        </span>
                        {#if cluster.count > 0}
                            <span class="cluster-count">{cluster.count}</span>
                        {/if}
                    </label>
                {:else}
                    <div class="no-results">No clusters match "{searchQuery}"</div>
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
        background-color: #6366f1;
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
        color: #6366f1;
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

    .search-icon {
        position: absolute;
        left: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 11px;
        color: #888;
        pointer-events: none;
    }

    .cluster-search-input {
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

    .cluster-search-input:focus {
        border-color: #6366f1;
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

    .cluster-list {
        max-height: 220px;
        overflow-y: auto;
        background-color: #1e1f29;
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        padding: 4px 6px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .cluster-checkbox-label {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 4px 6px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11.5px;
        color: #ddd;
        user-select: none;
    }

    .cluster-checkbox-label:hover {
        background-color: #2b2d3d;
    }

    .cluster-checkbox-label input[type="checkbox"] {
        accent-color: #6366f1;
        cursor: pointer;
        width: 13px;
        height: 13px;
        margin: 0;
    }

    .color-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .cluster-name {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .cluster-count {
        font-size: 10px;
        color: #888;
        margin-left: auto;
    }

    .no-results {
        padding: 10px;
        text-align: center;
        font-size: 12px;
        color: #888;
    }
</style>
