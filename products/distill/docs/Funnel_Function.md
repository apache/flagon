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

# Funnel

## The Funnel Function

```python
funnel(edges, targets, node_labels=False, *, infer=True)
```

Creates an interactive Plotly Funnel figure (`go.Figure`) from a list of 2-element edge tuples and either a starting target string (3-step inferred funnel) or an explicit sequence of step targets.

- **`edges`**: List of 2-element tuples `(source, target)`
- **`targets`**: Either:
  - A single target string (e.g. `'#document'`) to infer the most common 3-step path starting at that target (`infer=True`), or
  - A sequence of step target strings (e.g. `['#document', 'input', 'button']`) for an explicit multi-step funnel
- **`node_labels`** *(Optional)*: Dictionary mapping original target strings to display labels
- **`infer`** *(Optional)*: When `True` and `targets` is a single string (or 1-element list), infers the top 3-step path from `edges`

Returns a `plotly.graph_objects.Figure` (does not call `fig.show()` automatically, so it works cleanly in both headless pipelines and Jupyter notebooks).

## Funnel Example

Below is an example of a Funnel Diagram:

[![funnelexample.png](https://i.postimg.cc/qvPxbKqT/newplot-2.png)](https://postimg.cc/tsz67YFS)
Additionally, users have the option to pass a dictionary of node labels
to replace existing labels.

Below is an example:

**Input:**

``` python
edges = [('#document', 'button#test_button'),
 ('button#test_button', '#document'),
 ('#document', 'input'),
 ('input', 'button'),
 ('button', 'input'),
 ('input', 'form#test_text_input'),
 ('form#test_text_input', 'input'),
 ('input', 'button'),
 ('button', 'form#test_text_input'),
 ('form#test_text_input', '#document'),
 ('#document', 'form#test_radio_input'),
 ('form#test_radio_input', 'input'),
 ('input', 'button#Mock Request Button'),
 ('button#Mock Request Button', '#document'),
 ('#document', 'input'),
 ('input', 'button'),
 ('button', 'form#test_text_input'),
 ('form#test_text_input', 'p'),
 ('p', '#document'),
 ('#document', 'button#test_button'),
 ('button#test_button', '#document'),
 ('#document', 'form#test_radio_input'),
 ('form#test_radio_input', 'input'),
 ('input', 'form#test_radio_input'),
 ('form#test_radio_input', 'input')]

userspec = 'input'

funnel(edges, userspec)
```

**Output:**
[![image1](https://i.postimg.cc/FzHydgWj/newplot-3.png)](https://postimg.cc/dkgkgdK1)

Now we can add the optional node labels to be replaced. **Input:**

``` python
edges = [('#document', 'button#test_button'),
 ('button#test_button', '#document'),
 ('#document', 'input'),
 ('input', 'button'),
 ('button', 'input'),
 ('input', 'form#test_text_input'),
 ('form#test_text_input', 'input'),
 ('input', 'button'),
 ('button', 'form#test_text_input'),
 ('form#test_text_input', '#document'),
 ('#document', 'form#test_radio_input'),
 ('form#test_radio_input', 'input'),
 ('input', 'button#Mock Request Button'),
 ('button#Mock Request Button', '#document'),
 ('#document', 'input'),
 ('input', 'button'),
 ('button', 'form#test_text_input'),
 ('form#test_text_input', 'p'),
 ('p', '#document'),
 ('#document', 'button#test_button'),
 ('button#test_button', '#document'),
 ('#document', 'form#test_radio_input'),
 ('form#test_radio_input', 'input'),
 ('input', 'form#test_radio_input'),
 ('form#test_radio_input', 'input')]

userspec = 'input'
labels = {'form#test_text_input':'test_text_input'}        
funnel(edges, userspec, labels)
```

**Output:**
[![image2](https://i.postimg.cc/rwrSrpJY/newplot-4.png)](https://postimg.cc/RWv6r42c)
