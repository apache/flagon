---
title: Apache Distill HTTP Client
component: distill
---

### RESTful Endpoints
>
```python
distill.app.create(app_id)
```

> Registers an application in Distill.

>
```shell
$ curl -XPOST https://localhost:8090/xdata_v3
```

> **Parameters:**
- app_id – Application name

> **Returns:**
- Newly created application’s status as JSON blob

>
```python
distill.app.delete(app_id)
```

> Deletes an application permentantly from Distill

>
```shell
$ curl -XDELETE https://localhost:8090/xdata_v3
```

> **Parameters:**
- app_id – Application name

> **Returns:**
- Boolean response message as JSON blob

>
```python
distill.app.denoise(app_id)
```

> Bootstrap script to cleanup the raw logs. A document type called “parsed” will be stored with new log created unless specified in the request. Have option to save parsed results back to data store. These parsed logs can be intergrated with STOUT results by running the stout bootstrap script.

>
```shell
$ curl -XGET https://localhost:8090/denoise/xdata_v3?save=true&type=parsed
```

> **Parameters:**
- app_id – Application name

> **Returns:**
- [dict]

>
```python
distill.app.index()
```

> Show Distill version information, connection status, and all registered applications.

>
```shell
$ curl -XGET https://localhost:8090
```

>
```javascript
{
        "author" : "Michelle Beard",
        "email" : "mbeard@draper.com",
        "name": "Distill",
        "status" : true,
        "version" : "1.0",
        "applications" : {
                "xdata_v3" : {
                        testing: 205,
                        parsed: 500,
                },
                "test_app" : {
                        logs: 500,
                        parsed: 100,
                }
        }
}
```

> **Returns:**
- Distill’s status information as JSON blob

>
```python
distill.app.merge_stout()
```

> Bootstrap script to aggregate user ale logs to stout master answer table This will save the merged results back to ES instance at new index stout OR denoise data first, then merge with the stout index... If STOUT is enabled, the select method expects a stout index to exist or otherwise it will return an error message.

>
```shell
$ curl -XGET https://locahost:8090/stout/xdata_v3
```

> **Returns:**
- Status message

>
```python
distill.app.page_not_found(error)
```

> Generic Error Message

>
```python
distill.app.segment(app_id, app_type)
```

> Search against an application on various fields.

>
```shell
$ curl -XGET https://[hostname]:[port]/search/
xdata_v3?q=session_id:A1234&size=100
&scroll=false&fl=param1,param2
```

> **Parameters:**
- app_id – Application name
- app_type – Optional document type to filter against
- q – Main search query. To return all documents, pass in q=*:*
- size – Maximum number of documents to return in request
- scroll – Scroll id if the number of documents exceeds 10,000
- fl – List of fields to restrict the result set

> **Returns:**
- JSON blob of result set

>
```python
distill.app.stat(app_id, app_type)
```

> Generic histogram counts for a single registered application filtered optionally by document type. View the Statistics document page for method definitions and arguments

>
```shell
$ curl -XGET https://localhost:8090/stat/xdata_v3/
testing/?stat=terms&elem=signup&event=click
```

> **Parameters:**
- app_id – Application name
- app_type – Application type

> **Returns:**
- JSON blob of result set

>
```python
distill.app.status(app_id, app_type)
```

> Presents meta information about an registered application, including field names and document types.

>
```shell
$ curl -XGET https://localhost:8090/status/xdata_v3
```

>
```javascript
{
  "application": "xdata_v3",
  "health": "green",
  "num_docs": "433",
  "status": "open"
}
```

> **Parameters:**
- app_id – Application name

> **Returns:**
- Registered applications meta data as JSON blob

>
```python
distill.app.update(app_id)
```

> Renames a specific application

>
```shell
$ curl -XPOST https://localhost:8090/update/xdata_v3?name="xdata_v4"
```

> **Parameters:**
- app_id – Application name

> **Returns:**
- Boolean response message as JSON blob
