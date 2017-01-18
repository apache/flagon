---
title: Apache Distill Analytics
component: distill
---

### Graph Analytics

>
```python
class distill.algorithms.graphs.graph.GraphAnalytics
```

> **Bases:** object

> Distill’s graph analytics package. Apply graph algorithms to User Ale log data segmented with Stout.

>
```python
static foo()
```

### Statistics Package

>
```python
class distill.algorithms.stats.hist.Hist
```

> **Bases:** object

> Distill’s statistics package. Apply statistical algorithms to User Ale log data segmented with Stout. Need to query/filter by session or user id.

>
```python
get_value()
```

>
```python
static histogram(app, app_type=None, q='')
```
Only works on numerical data.

>
```python
static terms(app, app_type=None, q='')
```
Group by field (find all elements )

>
```python
static unique_terms(app, app_type=None, q='')
```
Aggregate the number of unique terms in a field. Missing values are counted and marked as “N/A”.

> **Todo:** Need to incorporate QueryBuilder library instead of manually generating queries.

> **Parameters:**
- app – [string] application name
- app_type – [string] application type
- field – [string] field to search against for unique values
- size – [int] the top size terms returned in the result. Default value is 10.
- min_hits – [int] return tags which have been found in min_hits or more. Default value is 1.

> **Returns:**
- [dict] dictionary of results
