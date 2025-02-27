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

# Graph Functions

The file 'graph.py' provides Python functions for creating charts from edge lists.

## Sankey Function

```python
sankey(edges_segmentN, node_labels=False)
```

The Sankey Function passes an edge list, or a list of tuples, and returns a Sankey, or a flow chart where width corresponds to quantity. Below is an example of a Sankey Diagram:

[![sankey0.png](https://i.postimg.cc/4NnnmphJ/sankey0.png)](https://postimg.cc/w789ryVP)
Additionally, users have the option to pass a dictionary of node labels to replace existing labels.

Below is an example:

**Input:**
```python
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

## Funnel Function

```python
funnel(edges_segmentN, user_specification, node_labels=False)
```

The Funnel Function takes the arguments: 
edges_segmentN: List of Tuples
user_specification: A string of target of interest e.g. #document
node_labels (Optional): Optional Dictionary of key default values with value replacements 
And it will return a Funnel graph. Below is an example of a Funnel Diagram:

[![funnelexample.png](https://i.postimg.cc/qvPxbKqT/newplot-2.png)](https://postimg.cc/tsz67YFS)
Additionally, users have the option to pass a dictionary of node labels to replace existing labels.

Below is an example:

**Input:**
```python
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
[![sankey.png](https://i.postimg.cc/FzHydgWj/newplot-3.png)](https://postimg.cc/dkgkgdK1)


Now we can add the optional node labels to be replaced.
**Input:**
```python
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
[![sankey.png](https://i.postimg.cc/rwrSrpJY/newplot-4.png)](https://postimg.cc/RWv6r42c)
