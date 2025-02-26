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

import networkx as nx

import distill


def test_create_di_graph_1():
    nodes = ["A", "B", "C", "D"]
    edges = [("A", "C"), ("C", "D"), ("B", "A"), ("A", "A")]
    graph = distill.createDiGraph(nodes, edges)
    assert isinstance(graph, nx.DiGraph)
    assert graph.has_node("A")
    assert graph.has_node("B")
    assert graph.has_node("C")
    assert graph.has_node("D")
    assert len(graph) == 4
    assert graph.has_edge("A", "C")
    assert graph.has_edge("C", "D")
    assert graph.has_edge("B", "A")
    assert graph.has_edge("A", "A")


def test_create_di_graph_2():
    nodes = ["A", "B", "C", "D"]
    edges = [("A", "C"), ("C", "D"), ("B", "A"), ("A", "A")]
    graph = distill.createDiGraph(nodes, edges, drop_recursions=True)
    assert isinstance(graph, nx.DiGraph)
    assert graph.has_node("A")
    assert graph.has_node("B")
    assert graph.has_node("C")
    assert graph.has_node("D")
    assert len(graph) == 4
    assert graph.has_edge("A", "C")
    assert graph.has_edge("C", "D")
    assert graph.has_edge("B", "A")


def test_sankey_1():
    edges = [("A", "C"), ("C", "D"), ("B", "A")]
    fig = distill.sankey(edges)
    fig_dict = fig.to_dict()
    assert len(fig_dict["data"][0]["node"]["label"]) == 4
    assert "A" in fig_dict["data"][0]["node"]["label"]
    assert "B" in fig_dict["data"][0]["node"]["label"]
    assert "C" in fig_dict["data"][0]["node"]["label"]
    assert "D" in fig_dict["data"][0]["node"]["label"]
    assert fig_dict["data"][0]["type"] == "sankey"


def test_sankey_2():
    edges = [("A", "C"), ("C", "D"), ("B", "A")]
    labels = {"A": "test_1", "B": "test_2", "C": "test_3"}
    fig = distill.sankey(edges, node_labels=labels)
    fig_dict = fig.to_dict()
    assert len(fig_dict["data"][0]["node"]["label"]) == 4
    assert "test_1" in fig_dict["data"][0]["node"]["label"]
    assert "test_2" in fig_dict["data"][0]["node"]["label"]
    assert "test_3" in fig_dict["data"][0]["node"]["label"]
    assert "D" in fig_dict["data"][0]["node"]["label"]
    assert fig_dict["data"][0]["type"] == "sankey"
