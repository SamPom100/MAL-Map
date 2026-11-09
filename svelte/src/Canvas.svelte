<script lang="ts">
	import { onMount } from "svelte";
	import { Application, Container, Graphics, Point, Text } from "pixi.js";
	import _ from "lodash";
	import { FullNode, Node, NODE_RADIUS } from "./ts/node";
	import { Edge, LineContainer } from "./ts/edge";
	import { Viewport } from "pixi-viewport";
	import { drawImages, drawLabels } from "./ts/draw";
	import { Layout } from "../../data-collection/layout";
	import { hslToHex, params_dict, updateHashParams } from "./ts/base_utils";
	import { Writable } from "svelte/store";
	import { Cluster_Nodes } from "./ts/utils";
	import { METADATA_DICT } from "./ts/base_types";
	import { getClusterName } from "./ts/cluster_names";
	import { pinnedClusters } from "./store";

	let canvas: HTMLCanvasElement;
	export let onInit: (
		nodes: FullNode[],
		node_map: { [id: number]: FullNode }
	) => void;
	export let selected_anime: Writable<any>;

	export let Metadata_: METADATA_DICT;
	export let Edges: (number | string)[][];
	export let Layout_: any;

	onMount(async () => {
		const app = new Application({
			view: canvas,
			width: window.innerWidth,
			height: window.innerHeight,
			resolution: window.devicePixelRatio || 1,
			autoDensity: true,
			backgroundColor: 0x2c2620,
			resizeTo: window,
		});
		const zoomIn = document.getElementById("zoom-in") as HTMLElement;
		const zoomOut = document.getElementById("zoom-out") as HTMLElement;
		const circle_template: Graphics = new Graphics();
		circle_template.beginFill(0xffffff);
		circle_template.drawCircle(0, 0, NODE_RADIUS);
		const texture = app.renderer.generateTexture(circle_template);

		const SCALE_BY = 0.95;
		zoomIn.addEventListener(
			"click",
			function () {
				viewport.zoomPercent(SCALE_BY, true);
			},
			false
		);
		zoomOut.addEventListener(
			"click",
			function () {
				viewport.zoomPercent(-(SCALE_BY / (1 + SCALE_BY)), true);
			},
			false
		);

		const viewport = new Viewport({
			interaction: app.renderer.plugins.interaction,
			stopPropagation: true,
			passiveWheel: false,
		});
		viewport.sortableChildren = true;
		viewport.moveCenter(0, 0);

		viewport
			.drag()
			.pinch()
			.wheel({
				trackpadPinch: true,
				wheelZoom: true,
				percent: 0.1,
			})
			.decelerate();
		(window as any).viewport = viewport;

		// Prevent browser page zoom from trackpad pinch or Ctrl+wheel
		const onWheel = (e: WheelEvent) => {
			if (e.ctrlKey) {
				e.preventDefault();
			}
		};
		window.addEventListener("wheel", onWheel, { passive: false });

		const onGesture = (e: Event) => e.preventDefault();
		window.addEventListener("gesturestart", onGesture);
		window.addEventListener("gesturechange", onGesture);
		window.addEventListener("gestureend", onGesture);

		window.addEventListener("resize", () => {
			viewport.resize(window.innerWidth, window.innerHeight);
		});

		app.stage.addChild(viewport);

		console.log(`${_.size(Metadata_)} anime`);

		let nodes: Node[] = [];
		let edges = [];
		let line_container = new LineContainer(20);
		let pinnedClusterKeys: string[] = [];
		pinnedClusters.subscribe((keys) => {
			pinnedClusterKeys = keys || [];
		});

		interface ClusterVisual {
			container: Container;
			lastTriggerTime: number;
			isFadingIn: boolean;
		}
		let clusterVisualsByHue: { [hueKey: string]: ClusterVisual } = {};
		let lastActiveHue: string | null = null;

		viewport.on("clicked", (event) => {
			if (FullNode.last_click_time > Date.now() - 200) {
				return;
			}
			Node.selected = null;
			selected_anime.set(undefined); // force update
			selected_anime.set(null);
		});

		// Render loop
		if (params_dict.animate === "true") {
			app.ticker.add(updateSimulation);
		} else {
			drawLayout(Layout_);
		}

		function updateNodes() {
			for (const node of nodes) {
				node.graphics.visible = false;
			}
			const viewport_bounds = viewport.getVisibleBounds();
			viewport_bounds.pad(viewport_bounds.width * 0.2);
			let vis_nodes = nodes.filter((node) =>
				viewport_bounds.contains(node.x, node.y)
			) as FullNode[];
			vis_nodes.sort((a, b) => {
				return b.metadata.members - a.metadata.members;
			});
			vis_nodes = vis_nodes.slice(0, 1000);
			for (const node of vis_nodes) {
				node.update();
				node.graphics.visible = true;
			}
			const invisible_nodes = _.difference(nodes, vis_nodes);
			for (const node of invisible_nodes) {
				node.label.visible = false;
			}

			// Dynamic cluster highlighting:
			// - Hover/selected trigger triggers a 5-second reveal.
			// - If already visible in the same cluster, maintain visibility without resetting alpha/fade-in.
			// - Pinned clusters via menu checkboxes stay permanently visible (alpha = 1.0).
			const activeNode = Node.hovered || (Node.selected as FullNode);
			const activeHue =
				activeNode && typeof activeNode.hue === "number"
					? (Math.round(activeNode.hue * 100) / 100).toFixed(2)
					: null;

			const now = Date.now();
			if (activeHue !== null && clusterVisualsByHue[activeHue]) {
				const item = clusterVisualsByHue[activeHue];
				const elapsed = now - item.lastTriggerTime;
				if (elapsed >= 5250 || item.lastTriggerTime === 0) {
					// Cluster was faded out or inactive: trigger a fresh fade-in
					item.lastTriggerTime = now;
					item.isFadingIn = true;
				} else {
					// Cluster is already visible: extend timer to full hold without restarting fade-in
					item.lastTriggerTime = now - 250;
					item.isFadingIn = false;
				}
			}
			lastActiveHue = activeHue;

			for (const [hueKey, item] of Object.entries(clusterVisualsByHue)) {
				const isPinned = pinnedClusterKeys.includes(hueKey);
				if (isPinned) {
					item.container.visible = true;
					item.container.alpha = 1.0;
					continue;
				}

				if (item.lastTriggerTime === 0) {
					item.container.visible = false;
					item.container.alpha = 0;
					continue;
				}

				const elapsed = now - item.lastTriggerTime;
				if (elapsed < 250 && item.isFadingIn) {
					// Smooth initial fade in over 250ms
					item.container.visible = true;
					item.container.alpha = Math.max(0.01, elapsed / 250);
				} else if (elapsed < 5250) {
					// Hold full visibility smoothly for 5 seconds
					item.container.visible = true;
					item.container.alpha = 1.0;
					item.isFadingIn = false;
				} else if (elapsed < 5850) {
					// Smooth fade out over 600ms
					item.container.visible = true;
					item.container.alpha = Math.max(
						0,
						1.0 - (elapsed - 5250) / 600
					);
				} else {
					item.container.visible = false;
					item.container.alpha = 0;
					item.isFadingIn = false;
				}
			}

			drawLabels(vis_nodes as FullNode[], viewport);
			drawImages(nodes as FullNode[], viewport);
			// line_container.setEdges(edges);
		}

		const all_edges = Edges.map((v) => {
			return [v[0] as number, v[1] as number, parseFloat(v[2] as string)];
		});
		const layout = new Layout(Cluster_Nodes, all_edges, 20);
		const start_layout = Date.now();
		function updateSimulation() {
			if (layout.done) {
				app.ticker.remove(updateSimulation);
				console.log(
					`layout took ${(Date.now() - start_layout) / 1000}s`
				);
				drawLayout(layout.toJSON());
				return;
			}

			layout.tick(5);
			updateView();

			function updateView() {
				viewport.removeChildren();
				let node_map = {};
				nodes = layout.simulation.nodes().map((node) => {
					const new_node = new Node(node.id);
					new_node.x = node.x;
					new_node.y = node.y;
					new_node.hue = node.hue;
					node_map[node.id] = new_node;
					return new_node;
				});
				edges = layout.edges.map((e) => {
					return new Edge(
						node_map[e.source.id],
						node_map[e.target.id],
						e.weight
					);
				});
				line_container.setEdges(edges);

				for (const line of line_container.buckets) {
					viewport.addChild(line);
				}

				for (const node of nodes) {
					node.addSprite(texture);
					viewport.addChild(node.graphics);
					node.update();
				}
			}
		}

		function drawLayout(layout_json) {
			viewport.removeChildren();
			let node_map: { [id: number]: Node } = {};
			nodes = _.entries(layout_json.nodes).map(([id_, pos]) => {
				let id = parseInt(id_);
				let new_node = FullNode.fromPos(id, pos, Metadata_[id]);
				node_map[id] = new_node;
				return new_node;
			});
			edges = layout_json.edges.map((e) => {
				return new Edge(node_map[e[0]], node_map[e[1]], e[2]);
			});
			line_container.setEdges(edges);

			// Draw cluster backgrounds, borders, and region labels
			const clusterContainer = new Container();
			clusterContainer.zIndex = -10;
			clusterVisualsByHue = {};

			const hueGroups: { [hue: number]: { x: number; y: number }[] } = {};
			for (const [id, pos] of Object.entries(
				layout_json.nodes as {
					[id: string]: { x: number; y: number; hue: number };
				}
			)) {
				const h = Math.round(pos.hue * 100) / 100;
				hueGroups[h] = hueGroups[h] || [];
				hueGroups[h].push(pos);
			}

			for (const [hueStr, posList] of Object.entries(hueGroups)) {
				const hue = parseFloat(hueStr);
				if (posList.length < 3) continue;
				const cx = _.meanBy(posList, (p) => p.x);
				const cy = _.meanBy(posList, (p) => p.y);
				const dists = posList
					.map((p) => Math.hypot(p.x - cx, p.y - cy))
					.sort((a, b) => a - b);
				const p95 =
					dists[Math.floor(dists.length * 0.95)] ||
					dists[dists.length - 1];
				const radius = p95 + 60;
				const hex = hslToHex(hue, 55, 50);

				const groupContainer = new Container();
				groupContainer.visible = false;

				const g = new Graphics();
				g.beginFill(hex, 0.08);
				g.lineStyle(2.5, hex, 0.5);
				g.drawCircle(cx, cy, radius);
				g.endFill();
				groupContainer.addChild(g);

				const clusterTitle = getClusterName(hue);
				const label = new Text(clusterTitle.toUpperCase(), {
					fontFamily: "Karla, Arial, sans-serif",
					fontSize: Math.max(radius * 0.08, 32),
					fontWeight: "700",
					fill: hslToHex(hue, 75, 75),
					align: "center",
					letterSpacing: 2,
					dropShadow: true,
					dropShadowColor: 0x000000,
					dropShadowBlur: 8,
					dropShadowDistance: 2,
				});
				label.anchor.set(0.5, 1);
				label.position.set(cx, cy - radius - 12);
				label.alpha = 0.9;
				groupContainer.addChild(label);

				clusterContainer.addChild(groupContainer);
				clusterVisualsByHue[hue.toFixed(2)] = {
					container: groupContainer,
					lastTriggerTime: 0,
					isFadingIn: false,
				};
			}

			viewport.addChild(clusterContainer);

			for (const line of line_container.buckets) {
				viewport.addChild(line);
			}

			for (const node of nodes) {
				node.addSprite(texture);
				viewport.addChild(node.graphics);
				viewport.addChild(node.label);
				node.update();
			}
			app.ticker.add(updateNodes);

			viewport.clampZoom({
				minWidth: 50,
				maxWidth: 10000,
			});
			viewport.setZoom(0.01);

			if (params_dict.show) {
				const node = (nodes as FullNode[]).find(
					(node) =>
						node.metadata.canonicalTitle() === params_dict.show
				);
				if (node) {
					selected_anime.set(node.metadata);
				}
			}

			selected_anime.subscribe((anime) => {
				if (!anime) {
					params_dict.show = null;
					updateHashParams();
					return;
				}

				const node = node_map[anime.id] as FullNode;
				if (FullNode.last_click_time < Date.now() - 200) {
					Node.selected = node;
					viewport.animate({
						position: new Point(node.x, node.y),
						scale: 2,
						time: 500,
						ease: "easeInOutSine",
					});
				}

				// update hash
				params_dict.show = node.metadata.canonicalTitle();
				updateHashParams();
			});

			onInit(nodes as FullNode[], node_map as { [id: number]: FullNode });

			Node.selected_anime = selected_anime;
		}
	});
</script>

<canvas bind:this={canvas} />
<div class="zoom-options">
	<button class="zoom-option" id="zoom-in">+</button>
	<button class="zoom-option" id="zoom-out">-</button>
</div>

<style>
	canvas {
		touch-action: none;
		display: block;
	}
	.zoom-options {
		position: fixed;
		bottom: 10px;
		right: 10px;
	}
	.zoom-option {
		font-size: 2rem;
		width: 40px;
		height: 40px;
		background-color: var(--color-d-white);
		border-radius: 6px;
		border: none;
		cursor: pointer;
		color: var(--color-d-gray-40);
		font-weight: bold;
	}
</style>
