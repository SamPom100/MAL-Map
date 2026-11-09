<script lang="ts">
    import AnimeView from "./AnimeView.svelte";
    import Canvas from "./Canvas.svelte";
    import GenreFilter from "./GenreFilter.svelte";
    import ClusterListFilter from "./ClusterListFilter.svelte";
    import LangButton from "./LangButton.svelte";
    import Searchbar from "./Searchbar.svelte";
    import Sidebar from "./Sidebar.svelte";
    import SidebarHeader from "./SidebarHeader.svelte";
    import { Metadata, nativeTitle, queryUser } from "./ts/utils";
    import {
        completedList,
        distance,
        endYear,
        pinnedClusters,
        scoreThreshold,
        selectedGenres,
        selected_anime,
        startYear,
        username,
    } from "./store";
    import _ from "lodash";
    import TextInput from "./TextInput.svelte";
    import SliderFilter from "./SliderFilter.svelte";
    import { FullNode, Node } from "./ts/node";
	import Edges from "../../data-collection/data/edges.json";
	import Layout_ from "../../data-collection/data/layout.json";
import { ANIME_DATA } from "./ts/types";

    function getOptionLabel(option) {
        if (!option) return "";
        if (!option.englishTitle) return option.title;
        if (option.title === option.englishTitle) return option.title;
        if (nativeTitle(option) === option.englishTitle) {
            return `${option.englishTitle} (${option.title})`;
        } else {
            return `${option.title} (${option.englishTitle})`;
        }
    }

    let options = _.values(Metadata) as ANIME_DATA[];
    let allGenres: string[] = _.sortBy(
        _.uniq(
            options.flatMap((o) => o.genres || [])
        )
    );

    let clusterCounts: { [hueKey: string]: number } = {};
    for (const [id, pos] of Object.entries(
        (Layout_ as any).nodes as { [id: string]: { hue: number } }
    )) {
        const k = (Math.round(pos.hue * 100) / 100).toFixed(2);
        clusterCounts[k] = (clusterCounts[k] || 0) + 1;
    }

    async function handleSubmit(e: Event, input: string) {
        e.preventDefault();
        console.log(input);
        username.set(input);
        if (input === "") {
            completedList.set([]);
            return;
        }

        const list = await queryUser(input);
        if (list === null) {
            alert("User not found or server error, please try again."); // TODO: prettier error handling
        } else {
            completedList.set(list);
        }
        $distance = $distance; // force update
    }

    function onInit(nodes: FullNode[], node_map: { [id: number]: FullNode }) {
        function updateBrightness(
            node: FullNode,
            distance: number,
            scoreThreshold: number,
            startYear: number,
            endYear: number,
            selectedGenresList: string[]
        ) {
            const metadata = node.metadata as ANIME_DATA;
            const passingScore = metadata.score >= scoreThreshold;
            const yearInRange =
                metadata.year <= endYear &&
                metadata.year >= startYear;
            const inRecs = node.recommendation_rank <= distance;
            const genreMatch =
                !selectedGenresList ||
                selectedGenresList.length === 0 ||
                (metadata.genres &&
                    selectedGenresList.every((g) =>
                        metadata.genres.includes(g)
                    ));

            if (passingScore && yearInRange && inRecs && genreMatch) {
                node.brightness = 1;
            } else {
                node.brightness = 0.2;
            }
        }

        function updateAllBrightness(nodes: FullNode[]) {
            nodes.forEach((node) => {
                updateBrightness(
                    node,
                    $distance,
                    $scoreThreshold,
                    $startYear,
                    $endYear,
                    $selectedGenres
                );
            });
        }

        distance.subscribe(() => updateAllBrightness(nodes));
        scoreThreshold.subscribe(() => updateAllBrightness(nodes));
        startYear.subscribe(() => updateAllBrightness(nodes));
        endYear.subscribe(() => updateAllBrightness(nodes));
        selectedGenres.subscribe(() => updateAllBrightness(nodes));

        completedList.subscribe((list) => {
            const startNodes =
                list?.length > 0
                    ? list.map((id) => node_map[id]).filter((node) => node)
                    : nodes;
            Node.bfs(startNodes, nodes);
            updateAllBrightness(nodes);
        });
    }
</script>

<Canvas {onInit} {selected_anime} 
   Metadata_={Metadata}
    Edges={Edges.Edges}
    {Layout_}
/>

<Sidebar>
    <SidebarHeader
        slot="top-header"
        githubURL="https://github.com/SamPom100/malmap"
    >
        <LangButton />
    </SidebarHeader>
    <Searchbar slot="searchbar" {selected_anime} {options} {getOptionLabel} />
    <div slot="filters" class="controls-container">
        <TextInput
            placeholder="MyAnimeList Username"
            title="Enter your MyAnimeList username and press the search icon"
            {handleSubmit}
        />
        <SliderFilter
            label="Distance to user watched list"
            value={distance}
            min={0}
            max={1}
            step={0.01}
        />
        <SliderFilter
            label="Minimum score"
            value={scoreThreshold}
            min={0}
            max={10}
            step={0.01}
        />
        <SliderFilter
            range
            label="Year"
            start={startYear}
            end={endYear}
            min={1960}
            max={2026}
            step={1}
        />
        <GenreFilter value={selectedGenres} genres={allGenres} />
        <ClusterListFilter pinned={pinnedClusters} {clusterCounts} />
    </div>

    <AnimeView slot="metadata-view" />
</Sidebar>

<style lang="scss">
    .controls-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        margin-top: 8px;
        margin-bottom: 16px;
    }
</style>
