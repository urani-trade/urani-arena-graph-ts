"use client";  // Ensure this component is treated as a Client Component

import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import './token-transfer-graph.css';

export const TokenTransferGraph = () => {
    const [data, setData] = useState(null);
    const graphRef = useRef(null);

    useEffect(() => {
        // Hardcoded data equivalent to the given data.csv, with graph name as part of each dictionary
        const graphData = [
            {
                name: "SOL",
                nodes: ["Harry", "Mario", "Sarah", "Alice", "Eveie", "Peter", "James", "Roger"],
                links: [
                    { source: "Harry", destination: "Mario", value: "SOL" },
                    { source: "Sarah", destination: "Alice", value: "SOL" },
                    { source: "Eveie", destination: "Alice", value: "SOL" },
                    { source: "Peter", destination: "Alice", value: "SOL" },
                    { source: "Mario", destination: "Alice", value: "SOL" },
                    { source: "James", destination: "Alice", value: "SOL" },
                    { source: "Alice", destination: "Mario", value: "SOL" },
                    { source: "Sarah", destination: "James", value: "SOL" },
                    { source: "Roger", destination: "James", value: "SOL" },
                    { source: "James", destination: "Roger", value: "SOL" },
                    { source: "Alice", destination: "Peter", value: "SOL" },
                    { source: "Alice", destination: "Eveie", value: "SOL" },
                    { source: "Harry", destination: "Eveie", value: "SOL" },
                    { source: "Eveie", destination: "Harry", value: "SOL" },
                    { source: "James", destination: "Sarah", value: "SOL" },
                    { source: "Alice", destination: "Sarah", value: "SOL" }
                ]
            },
            {
                name: "ETH",
                nodes: ["0xRekt", "0xBeef", "0xDead"],
                links: [
                    { source: "0xRekt", destination: "0xBeef", value: "ETH" },
                    { source: "0xBeef", destination: "0xRekt", value: "ETH" },
                    { source: "0xBeef", destination: "0xDead", value: "ETH" },
                    { source: "0xDead", destination: "0xRekt", value: "ETH" },
                    { source: "0xRekt", destination: "0xBeef", value: "ETH" }
                ]
            },
            {
                name: "BTC",
                nodes: ["Jake", "Bob", "Charlie", "Dave"],
                links: [
                    { source: "Jake", destination: "Bob", value: "BTC" },
                    { source: "Bob", destination: "Charlie", value: "BTC" },
                    { source: "Charlie", destination: "Dave", value: "BTC" },
                    { source: "Dave", destination: "Jake", value: "BTC" }
                ]
            },
            {
                name: "LTC",
                nodes: ["X", "Y", "Z"],
                links: [
                    { source: "X", destination: "Y", value: "LTC" },
                    { source: "Y", destination: "Z", value: "LTC" },
                    { source: "Z", destination: "X", value: "LTC" },
                    { source: "X", destination: "Z", value: "LTC" }
                ]
            }
        ];

        // Flatten the nodes and links arrays for D3
        const nodes = [];
        const links = [];
        const nodeMap = new Map();

        graphData.forEach(graph => {
            graph.nodes.forEach(nodeName => {
                if (!nodeMap.has(nodeName)) {
                    const node = { name: nodeName, graph: graph.name };
                    nodes.push(node);
                    nodeMap.set(nodeName, node);
                }
            });
            graph.links.forEach(link => {
                links.push({ source: nodeMap.get(link.source), target: nodeMap.get(link.destination), value: link.value, graph: graph.name });
            });
        });

        setData({ nodes, links });
    }, []);

    useEffect(() => {
        if (!data) return;

        const container = d3.select(graphRef.current);
        container.select("svg").remove(); // Remove any existing SVG to avoid duplicates
        const { width, height } = container.node().getBoundingClientRect();

        // Define the width and height for the SVG's viewBox
        const viewBoxWidth = 1000;
        const viewBoxHeight = 1000;

        const centerX = viewBoxWidth / 2;
        const centerY = viewBoxHeight / 2;

        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links).id(d => d.name).distance(160))
            .force("charge", d3.forceManyBody().strength(-2000))
            .force("center", d3.forceCenter(centerX, centerY))
            .force("gravity", d3.forceRadial(0.5, centerX, centerY))
            .force("tangential", tangentialForce(2, centerX, centerY))
            .alphaDecay(0)
            .on("tick", tick);

        // Periodically reset alpha to maintain stability
        d3.interval(() => {
            simulation.alpha(0.3).restart();
        }, 1000);

        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("background-color", "transparent");

        const g = svg.append("g");

        // Build the arrow
        g.append("defs").selectAll("marker")
            .data(["end"])
            .enter().append("marker")
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "green");

        // Add the links and the arrows
        const path = g.append("g").selectAll("path")
            .data(data.links)
            .enter().append("path")
            .attr("class", "link")
            .attr("marker-end", "url(#end)")
            .style("stroke", "green");

        // Add the link labels
        const linkLabels = g.append("g").selectAll(".link-label")
            .data(data.links)
            .enter().append("text")
            .attr("class", "link-label")
            .attr("dy", ".35em")
            .style("fill", "green")
            .text(d => d.value);

        // Define the nodes
        const node = g.selectAll(".node")
            .data(data.nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on("click", function(event, d) {
                // Get the direction vector for each graph
                const graphVectors = {
                    "SOL": { x: 1, y: 1 },
                    "ETH": { x: -1, y: 1 },
                    "BTC": { x: -1, y: -1 },
                    "LTC": { x: 1, y: -1 }
                };

                const clickedGraph = d.graph;

                // Disable tangential force
                simulation.force("tangential", null);

                const transitionNodes = d3.selectAll(".node")
                    .filter(n => n.graph !== clickedGraph);

                const transitionLinks = d3.selectAll(".link")
                    .filter(l => l.graph !== clickedGraph);

                const transitionLinkLabels = d3.selectAll(".link-label")
                    .filter(l => l.graph !== clickedGraph);

                const exitVector = graphVectors[clickedGraph];

                transitionNodes.transition()
                    .duration(3000)
                    .attr("transform", n => {
                        const angle = Math.atan2(n.y - centerY, n.x - centerX);
                        const offsetX = 2000 * Math.cos(angle);
                        const offsetY = 2000 * Math.sin(angle);
                        return `translate(${offsetX}, ${offsetY})`;
                    })
                    .style("opacity", 0)
                    .on("end", function() {
                        d3.select(this).remove();
                    });

                transitionLinks.transition()
                    .duration(3000)
                    .attr("transform", l => {
                        const angle = Math.atan2(l.target.y - l.source.y, l.target.x - l.source.x);
                        const offsetX = 2000 * Math.cos(angle);
                        const offsetY = 2000 * Math.sin(angle);
                        return `translate(${offsetX}, ${offsetY})`;
                    })
                    .style("opacity", 0)
                    .on("end", function() {
                        d3.select(this).remove();
                    });

                transitionLinkLabels.transition()
                    .duration(3000)
                    .attr("transform", l => {
                        const angle = Math.atan2(l.target.y - l.source.y, l.target.x - l.source.x);
                        const offsetX = 2000 * Math.cos(angle);
                        const offsetY = 2000 * Math.sin(angle);
                        return `translate(${offsetX}, ${offsetY})`;
                    })
                    .style("opacity", 0)
                    .on("end", function() {
                        d3.select(this).remove();
                    });

                // Remove nodes from the simulation
                simulation.nodes(data.nodes.filter(n => n.graph === clickedGraph));
                simulation.force("link").links(data.links.filter(l => l.graph === clickedGraph));
                simulation.alpha(0.3).restart();
            });

        // Add the wide outlined rectangles for the nodes
        node.append("rect")
            .attr("width", 60)
            .attr("height", 20)
            .attr("x", -30)
            .attr("y", -10)
            .attr("fill", "transparent")
            .attr("stroke", "green");

        // Add the text
        node.append("text")
            .attr("x", -25)
            .attr("dy", ".35em")
            .style("fill", "green")
            .text(d => `${d.name} (${d.graph})`); // Modified to include graph name

        function tick() {
            node.attr("transform", d => `translate(${d.x},${d.y})`);

            path.attr("d", d => {
                const lineOffset = 25;
                const totalLength = Math.sqrt(Math.pow(d.target.x - d.source.x, 2) + Math.pow(d.target.y - d.source.y, 2));
                const reductionRatio = lineOffset / totalLength;

                const sourceX = d.source.x + (d.target.x - d.source.x) * reductionRatio;
                const sourceY = d.source.y + (d.target.y - d.source.y) * reductionRatio;
                const targetX = d.target.x - (d.target.x - d.source.x) * reductionRatio;
                const targetY = d.target.y - (d.target.y - d.source.y) * reductionRatio;

                const delta = calculatePerpendicularOffset(d, 4);
                return `M${sourceX + delta.dx},${sourceY + delta.dy}L${targetX + delta.dx},${targetY + delta.dy}`;
            });

            linkLabels
                .attr("x", d => {
                    const offset = 10;
                    const delta = calculatePerpendicularOffset(d, offset);
                    if (delta.dx < 0) {
                        const newOffset = 25;
                        return (d.source.x + d.target.x) / 2 + calculatePerpendicularOffset(d, newOffset).dx;
                    }
                    return (d.source.x + d.target.x) / 2 + delta.dx;
                })
                .attr("y", d => {
                    const offset = 10;
                    const delta = calculatePerpendicularOffset(d, offset);
                    return (d.source.y + d.target.y) / 2 + delta.dy;
                });
        }

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        function tangentialForce(strength, cx, cy) {
            return function() {
                data.nodes.forEach(d => {
                    const dx = d.x - cx;
                    const dy = d.y - cy;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance === 0) return;
                    const forceX = -dy / distance * strength;
                    const forceY = dx / distance * strength;
                    d.vx += forceX;
                    d.vy += forceY;
                });
            };
        }

        function resize() {
            const container = d3.select(graphRef.current);
            const { width, height } = container.node().getBoundingClientRect();

            svg.attr("width", width).attr("height", height);
            svg.attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
            simulation.force("center", d3.forceCenter(viewBoxWidth / 2, viewBoxHeight / 2));
            simulation.alpha(0.3).restart();
        }

        window.addEventListener("resize", resize);
        resize();

        for (let i = 0; i < 600; ++i) simulation.tick();

        return () => {
            window.removeEventListener("resize", resize);
        };
    }, [data]);

    const calculatePerpendicularOffset = (d, offset) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const perpendicularX = -dy / length * offset;
        const perpendicularY = dx / length * offset;
        return {
            dx: perpendicularX,
            dy: perpendicularY
        };
    }

    return (
        <div ref={graphRef} style={{ width: '100%', height: '700px' }}></div>
    );
};
