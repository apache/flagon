---
title: Apache Distill Models
component: distill
---

### Brew Interface
>
```python
class distill.models.brew.Brew
```

> **Bases:** object

> Distill supports basic CRUD operations and publishes the status of an persistenct database. Eventually it will support ingesting logs sent from an registered application.

>
```python
static create(app)
```

>Register a new application in Distill

>
```javascript
{
        "application" : "xdata_v3",
        "health" : "green",
        "num_docs" : 0,
        "status" : "open"
}
```

> **Parameters:**
- app – [string] application name (e.g. xdata_v3)

> **Returns:**
- [dict] dictionary of application and its meta information

>
```python
static delete(app)
```

>Technically closes the index so its content is not searchable.

> **Parameters:**
- app – [string] application name (e.g. xdata_v3)

> **Returns:**
- [dict] status message of the event

>
```python
static get_applications()
```

>Fetch all the registered applications in Distill.

> *Note:* Private indexes starting with a period are not included in the result set

> **Returns:**
- [dict] dictionary of all registered applications and meta information

>
```python
static get_status()
```

> Fetch the status of the underlying database instance.

> **Returns:**
- [bool] if connection to database instance has been established

>
```python
static read(app, app_type=None)
```

> Fetch meta data associated with an application

> Example:
```javascript
{
        "application" : "xdata_v3",
        "health" : "green",
        "num_docs" : "100",
        "status" : "open"
        "types" : {
                "raw_logs" : {
                        "@timestamp" : "date",
                        "action" : "string",
                        "elementId" : "string"
                },
                "parsed" : {
                        "@timestamp" : "date",
                        "elementId_interval" : "string"
                },
                "graph" : {
                        "uniqueID" : "string",
                        "transition_count" : "long",
                        "p_value" : "float"
                }
        }
}
```

> **Parameters:**
- app – [string] application name (e.g. xdata_v3)

> **Returns:**
- [dict] dictionary of application and its meta information

>
```python
static update(app)
```

> **Todo:** Currently not implemented

### Stout Interface
>
```python
class distill.models.stout.Stout
```

> **Bases:** object

 > Main Stout class to support ingest and search operations.

>
```python
static ingest()
```

> Ingest data coming from Stout to Distill

>
```python
class distill.models.stout.StoutDoc(meta=None, **kwargs)
```

> **Bases:** elasticsearch_dsl.document.DocType

> Representation of a Stout document.

>
```python
save(*args, **kwargs)
```

> Save data from parsing as a Stout document in Distill

### UserAle Interface
>
```python
class distill.models.userale.UserAle
```

> **Bases:** object

> Main method of entry to perform segmentation and integration of STOUT’s master answer table (if STOUT is enabled). Advanced and basic analytics is performed in the distill.algorithms.stats and distill.algorithms.graphs module.

>
```python
static denoise(app, app_type='parsed', save=False)
```

>
```python
static search(app, app_type=None, filters=[],
size=100, include='*', scroll=None, sort_field=None)
```

> Perform a search query.

> **Parameters:**
- app – [string] application id (e.g. “xdata_v3”)
- app_type – [string] name of the application type. If None all application types are searched.
- filters – [list of strings] list of filters for a query.
- size – [int] maximum number of hits that should be returned
- sort_field – [string] sorting field. Currently supported fields: “timestamp”, “date”

> **Returns**
- [dict] dictionary with processed results. If STOUT is enabled, STOUT data will be merged with final result.

>
```python
static segment(app, app_type=None, params='')
```

>Just support match all for now.

>
```python
distill.models.userale.merge_dicts(lst)
```

>
```python
distill.models.userale.parse_query_parameters(indx, app_type=None, request_args={})
```
