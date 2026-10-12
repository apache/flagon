<!--
  ~ Licensed to the Apache Software Foundation (ASF) under one
  ~ or more contributor license agreements.  See the NOTICE file
  ~ distributed with this work for additional information
  ~ regarding copyright ownership.  The ASF licenses this file
  ~ to you under the Apache License, Version 2.0 (the
  ~ "License"); you may not use this file except in compliance
  ~ with the License.  You may obtain a copy of the License at
  ~
  ~   http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing,
  ~ software distributed under the License is distributed on an
  ~ "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  ~ KIND, either express or implied.  See the License for the
  ~ specific language governing permissions and limitations
  ~ under the License.
-->

# Sankey

## The Sankey Function

```python
sankey(edges, node_labels=False, *, drop_recursions=False)
```

Creates an interactive Plotly Sankey figure (`go.Figure`) from a list of 2-element edge tuples and optional user-provided node labels.

- **`edges`**: List of 2-element tuples `(source, target)`
- **`node_labels`** *(Optional)*: Dictionary mapping original node names to replacement display labels
- **`drop_recursions`** *(Optional)*: When `True`, removes self-to-self transitions (`u == v`) before counting links

Returns a `plotly.graph_objects.Figure` (does not call `fig.show()` automatically, so it works cleanly in both headless pipelines and Jupyter notebooks).

## Sankey Example

Below is an example of a Sankey Diagram:

[![sankey0.png](https://i.postimg.cc/4NnnmphJ/sankey0.png)](https://postimg.cc/w789ryVP)
Additionally, users have the option to pass a dictionary of node labels
to replace existing labels.

Below is an example:

**Input:**

``` python
edges = [('a','b'),
         ('b','c'),
         ('c','b'),
         ('b','c'),
         ('c','d'),
         ('d','a')]

labels = {'d':'enD'}

sankey(edges, labels)
```

**Output:**
[![sankey.png](https://i.postimg.cc/50v6NJH8/sankey.png)](https://postimg.cc/YGrpbJzS)
