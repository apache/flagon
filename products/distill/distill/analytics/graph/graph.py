#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import collections
from datetime import timedelta

import networkx as nx
import plotly.express as px
import plotly.graph_objects as go


def get_partition(log, partition_elements):
    """
    Creates a partition of logs
    :param log: Log file
    :param partition_elements: Dictionary of elements mapped to colors
    :return: Partition
    """
    partition = list(set(log["path"]) & set(partition_elements))
    if len(partition) == 1:
        return partition[0]
    if len(partition) == 0:
        return "Other"
    return "Error with partitioning"


def get_color_graph(log_dict, color_dict, partition_func):
    """
    Creates a colored NetworkX Directed Graph Object (G) from a dictionary of logs
    :param log_dict: Dictionary of logs
    :param color_dict: Dictionary of elements:colors (mapping colors to nodes)
    :param partition_func: creates a partition of logs
    :return: A NetworkX graph object with the colors for each node
    """

    targets = []
    partition_dict = {}
    label_dict = {}
    for log in log_dict.values():
        targets.append("".join(log["path"]))
        partition_dict[targets[-1]] = partition_func(log, color_dict.keys())
        label_dict[targets[-1]] = log["target"]

    edges = list(nx.utils.pairwise(targets))

    graph = nx.DiGraph(
        (x, y, {"capacity": v}) for (x, y), v in collections.Counter(edges).items()
    )
    nx.set_node_attributes(graph, partition_dict, "partition")
    nx.set_node_attributes(graph, label_dict, "label")
    colors = [
        color_dict[p] for p in nx.get_node_attributes(graph, "partition").values()
    ]
    return (graph, colors)


def show_color_sankey(graph, color_dict):
    """
    Creates a colored Sankey Graph
    :param graph: The graph created from get_color_graph
    :param color_dict: Dictionary of element:colors (mapping colors to nodes)
    :return: A Sankey graph
    """
    labels = []
    colors = []
    nodes = []
    edges = list(graph.edges(data=True))
    for node in graph.nodes(data=True):
        nodes.append(node[0])
        labels.append(node[1]["label"])
        colors.append(color_dict[node[1]["partition"]])

    sources = [nodes.index(edge[0]) for edge in edges]
    targets = [nodes.index(edge[1]) for edge in edges]
    values = [edge[2]["capacity"] for edge in edges]

    go.Figure(
        data=[
            go.Sankey(
                textfont=dict(color="rgba(0,0,0,0)"),
                node=dict(label=labels, color=colors),
                link=dict(source=sources, target=targets, value=values),
            )
        ]
    ).show()


def createDiGraph(nodes, edges, *, drop_recursions: bool = False, node_labels=False):
    """
    Creates NetworkX Directed Graph Object (G) from defined node, edge list
    :param nodes: Series or List of Events, Elements
    :param edges: Series or List of Pairs
    :param drop_recursions: if True eliminates self:self pairs in edges
    :return: A NetworkX graph object
    """
    nodes = list(nodes)
    edges = list(edges)

    # Replace node names with the node_labels if it is given as an argument
    if node_labels:
        nodes = [
            node if node not in node_labels else node_labels[node] for node in nodes
        ]
        edges = [
            tuple(
                node if node not in node_labels else node_labels[node]
                for node in edge
            )
            for edge in edges
        ]

    # Remove self-to-self recursions
    if drop_recursions:
        edges = list(filter(lambda row: row[0] != row[1], edges))

    # Create a digraph with capacity attributes that
    # represent the number of edges between nodes
    graph = nx.DiGraph(
        (x, y, {"capacity": v}) for (x, y), v in collections.Counter(edges).items()
    )
    graph.add_nodes_from(nodes)
    return graph


def sankey(edges, node_labels=False, *, drop_recursions=False):
    """
    Creates Sankey Graph from defined edge list and optional user-provided labels
    :param edges_segmentN: List of Tuples
    :param node_labels: Optional Dictionary of Values; keys are originals, values\
        are replacements
    :return: A Sankey graph
    """

    # Convert raw edges to a weighted digraph
    graph = createDiGraph(
        list(), edges, node_labels=node_labels, drop_recursions=drop_recursions
    )
    nodes = list(graph.nodes())
    edges = graph.edges(data=True)

    # Format weighted edge data for the sankey function
    sources = [nodes.index(edge[0]) for edge in edges]
    targets = [nodes.index(edge[1]) for edge in edges]
    values = [edge[2]["capacity"] for edge in edges]

    return go.Figure(
        data=[
            go.Sankey(
                node=dict(label=nodes),
                link=dict(source=sources, target=targets, value=values),
            )
        ]
    )


def funnel(edges, targets, node_labels=False, *, infer=True):
    """
    Creates Funnel Graph from defined edge list and optional user-provided labels
    :param edges: List of Tuples
    :param targets: String or list of strings representing \
        elements of interest
    :param node_labels: Optional Dictionary of key default \
        values, value replacements
    :param infer: Optional boolean, true = consider nondirect \
        paths between targets and elements after the last target,\
        false = only consider the provided elements
    :return: A Funnel graph
    """

    # Convert raw edges to a weighted digraph
    graph = createDiGraph(list(), edges, drop_recursions=True, node_labels=node_labels)

    # Put raw strings into a list of one
    if isinstance(targets, str):
        targets = [targets]
    else:
        targets = list(targets)

    if not targets:
        return go.Figure(go.Funnel(y=[], x=[]))

    target_edges = list()
    if infer:
        # Find the path through each provided target that maximizes flow
        for i in range(len(targets) - 1):
            src, dst = targets[i], targets[i + 1]
            candidate_paths = (
                list(nx.all_simple_paths(graph, src, dst))
                if src in graph and dst in graph
                else []
            )
            if candidate_paths:
                path = max(
                    candidate_paths,
                    key=lambda p: nx.path_weight(graph, p, "capacity"),
                )
                target_edges.extend(nx.utils.pairwise(path))
            else:
                target_edges.append((src, dst))

        # Extend the path constructed above as much as possible without creating cycles
        last_target = targets[-1]
        if last_target in graph:
            dests = [dest for dest in graph.nodes() if dest not in targets]
            paths = (
                list(nx.all_simple_paths(graph, last_target, dests))
                if dests
                else []
            )
            visited_targets = [edge[0] for edge in target_edges]
            valid_paths = [
                p for p in paths if not (set(p) & set(visited_targets))
            ]
            if valid_paths:
                path = max(valid_paths, key=len)
                target_edges.extend(nx.utils.pairwise(path))
                targets = visited_targets + list(path)
            elif target_edges:
                targets = visited_targets + [target_edges[-1][1]]
    else:
        # Otherwise construct a path literally
        target_edges = list(nx.utils.pairwise(targets))

    if not target_edges:
        outflow = (
            sum(
                graph.get_edge_data(*edge)["capacity"]
                for edge in graph.out_edges(targets[0])
            )
            if targets[0] in graph
            else 0
        )
        return go.Figure(go.Funnel(y=targets, x=[outflow]))

    # Get the total outflow of the starting node
    first_node = target_edges[0][0]
    counts = (
        sum(
            graph.get_edge_data(*edge)["capacity"]
            for edge in graph.out_edges(first_node)
        )
        if first_node in graph
        else 0
    )

    # Get the flow at every other node in the path
    counts = [counts] + [
        (graph.get_edge_data(*edge) or {}).get("capacity", 0)
        for edge in target_edges
    ]
    counts = [min(counts[0:i]) for i in range(1, len(counts) + 1)]

    # Return a funnel representing the flow throughout the constructed path
    return go.Figure(go.Funnel(y=targets, x=counts))


def transition_matrix(
    edges_or_logs,
    *,
    drop_recursions: bool = False,
    node_labels=False,
    as_dataframe: bool = True,
):
    """
    Computes the first-order Markov state transition probability matrix
    P(target_{t+1} | target_t) from an edge list or a sequence/dict of UserALE logs.
    :param edges_or_logs: List of (source, target) edge tuples, or list/dict of UserALE logs
    :param drop_recursions: If True, removes self-transitions (target -> target)
    :param node_labels: Optional dictionary mapping raw target names to display labels
    :param as_dataframe: If True, returns a pandas.DataFrame; otherwise a nested dict
    """
    import pandas as pd

    if isinstance(edges_or_logs, dict):
        items = list(edges_or_logs.values())
    else:
        items = list(edges_or_logs)

    if items and isinstance(items[0], dict):
        targets = [
            str(log.get("target"))
            for log in items
            if isinstance(log, dict) and log.get("target")
        ]
        edges = list(nx.utils.pairwise(targets))
    else:
        edges = [tuple(e) for e in items if isinstance(e, (tuple, list)) and len(e) == 2]

    graph = createDiGraph(
        [], edges, drop_recursions=drop_recursions, node_labels=node_labels
    )
    nodes = sorted(graph.nodes())
    matrix_dict = {src: {dst: 0.0 for dst in nodes} for src in nodes}

    for src in nodes:
        out_edges = list(graph.out_edges(src, data=True))
        total_out = sum(edge[2].get("capacity", 0) for edge in out_edges)
        if total_out > 0:
            for _, dst, data in out_edges:
                matrix_dict[src][dst] = round(
                    data.get("capacity", 0) / total_out, 4
                )

    if as_dataframe:
        return pd.DataFrame.from_dict(matrix_dict, orient="index", columns=nodes)
    return matrix_dict


def display_segments(segments, log_dict, get_partition, name_dict):
    """
    Displays a Plotly timeline of Segment objects.

    :param segments: A Segments object containing the Segment objects to display
    :param log_dict: Dictionary of the logs
    :param get_partition: function to create our partitions
    :param name_dict: Dictionary of partitions, elements can be renamed in \
        dictionary using "k:v"
    """

    segment_metadata = []
    for segment in segments:
        first_log = log_dict[segment.get_segment_uids()[0]]
        segment_metadata.append(
            {
                "Start Time": segment.get_start_end_val()[0],
                "End Time": segment.get_start_end_val()[1] + timedelta(seconds=0.5),
                "Partition": name_dict[get_partition(first_log, name_dict.keys())],
                "Number of Clicks": segment.get_num_logs(),
            }
        )

    fig = px.timeline(
        segment_metadata,
        x_start="Start Time",
        x_end="End Time",
        y="Partition",
        color="Number of Clicks",
    )
    fig.update_yaxes(autorange="reversed")
    return fig
