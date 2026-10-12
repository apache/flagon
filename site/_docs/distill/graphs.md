---
title: Clickstream Graphs & Funnels
component: distill
permalink: /docs/distill/graphs/
priority: 2
---

**Apache Flagon Distill** models user clickstreams as directed behavioral graphs using [NetworkX](https://networkx.org/) and renders interactive flow visualizations with [Plotly](https://plotly.com/python/).

---

## Preparing Clickstream Edges

Given a list of UserALE logs or a sorted log dictionary from `distill.setup(...)`, extract sequential `(source_target, destination_target)` interaction pairs or pass the logs directly to `distill.transition_matrix(...)`:

```python
import distill
import networkx as nx

sorted_logs = distill.setup("userale_logs.json", date_type="datetime")
targets = [log["target"] for log in sorted_logs.values() if log.get("target")]
edges = list(nx.utils.pairwise(targets))
```

---

## Directed Behavioral Graphs (`createDiGraph`)

Builds a weighted `networkx.DiGraph` where each node is a DOM target (or mapped label) and each edge `(u, v)` carries a `capacity` attribute equal to the number of observed transitions from `u` to `v`.

```python
G = distill.createDiGraph(
    nodes=targets,
    edges=edges,
    drop_recursions=True,  # Exclude self-loops (target -> same target)
    node_labels={
        "button#add-to-cart": "Add to Cart",
        "a#checkout-link": "Checkout",
        "button#pay-now": "Submit Order",
    },
)

for u, v, data in G.edges(data=True):
    print(f"{u} -> {v}: {data['capacity']} transitions")
```

---

## First-Order Markov Transition Matrix (`transition_matrix`)

Computes the state-transition probability matrix $P(\text{target}_{t+1} \mid \text{target}_t)$ directly from either a list/dict of UserALE logs or a list of `(source, target)` edge tuples.

```python
# Returns a row-normalized pandas.DataFrame by default:
df_prob = distill.transition_matrix(
    sorted_logs,
    drop_recursions=True,
    as_dataframe=True,
)
print(df_prob)

# Or return a nested Python dictionary:
prob_dict = distill.transition_matrix(
    sorted_logs,
    drop_recursions=True,
    as_dataframe=False,
)
```

---

## Interactive Sankey Diagrams (`sankey`)

Generates a Plotly Sankey diagram (`go.Figure`) visualizing multi-step user flow volume across DOM targets:

```python
fig = distill.sankey(
    edges,
    node_labels={
        "button#search": "Search Catalog",
        "div.product-card": "View Product",
        "button#add-to-cart": "Add to Cart",
        "button#checkout": "Checkout",
    },
    drop_recursions=True,
)
fig.show()
```

---

## Conversion Funnels (`funnel`)

Computes conversion progression and drop-off across an ordered sequence of target milestones. When `infer=True` (default), Distill automatically discovers the maximum-capacity path between non-adjacent target milestones in the user clickstream graph:

```python
fig = distill.funnel(
    edges,
    targets=[
        "button#search",
        "button#add-to-cart",
        "button#checkout",
    ],
    infer=True,
)
fig.show()
```
