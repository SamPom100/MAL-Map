<script lang="ts">
    import _ from "lodash";

    import Genres from "./Genres.svelte";
    import Stats from "./Stats.svelte";
    import { selected_anime } from "./store";
    import { nativeTitle } from "./ts/utils";
    import { ANIME_DATA } from "./ts/types";
    import Layout_ from "../../data-collection/data/layout.json";
    import { getClusterName } from "./ts/cluster_names";
    let metadata: ANIME_DATA;
    let genres = [];
    let clusterName = "";
    selected_anime.subscribe((anime) => {
        metadata = anime;
        if (anime) {
            genres = _.clone(anime.genres);
            if (anime.year) {
                genres.push(anime.year.toString());
            }
            const pos = (Layout_ as any).nodes?.[anime.id];
            if (pos && typeof pos.hue === "number") {
                clusterName = getClusterName(pos.hue);
            } else {
                clusterName = "";
            }
        }
    });
</script>

{#if metadata}
    <div>
        <a href={metadata.url} target="_blank" rel="noopener noreferrer">
            <img src={metadata.picture} alt="Anime Thumbnail" />
        </a>
        <h1>{nativeTitle(metadata)}</h1>
        {#if clusterName}
            <div class="cluster-badge">
                <i class="fa fa-map-marker"></i> Region: {clusterName}
            </div>
        {/if}
        <Stats {metadata} />

        <Genres {genres} />

        <div class="synopsis">
            <p>{metadata.synopsis}</p>
        </div>
    </div>
{/if}

<style lang="scss">
    img {
        margin-left: auto;
        margin-right: auto;
        display: block;
        height: 50%;
    }
    h1 {
        font-size: 1.7em;
        margin-top: 8px;
        margin-bottom: 8px;
    }
    .cluster-badge {
        display: inline-block;
        margin-top: 2px;
        margin-bottom: 12px;
        padding: 4px 10px;
        border-radius: 12px;
        background: rgba(255, 102, 165, 0.15);
        border: 1px solid rgba(255, 102, 165, 0.4);
        color: #ff94c2;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.3px;
        :global(i) {
            margin-right: 5px;
        }
    }
    h4 {
        padding-top: 0;
        margin: 0;
        font-weight: 50;
        opacity: 0.5;
    }
    a {
        color: var(--text-normal);
        text-decoration: none;
    }

    .synopsis {
        height: 300px;
        overflow: auto;
        padding-bottom: 0;
        font-size: 15px;
        color: var(--color-d-gray-10);
    }

    ::-webkit-scrollbar {
        width: 8px;
    }

    ::-webkit-scrollbar-thumb {
        -webkit-appearance: none;
        background-color: var(--text-normal);
        border-radius: 4px;
    }
</style>
