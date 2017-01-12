---
title: Apache Distill Utilities
component: distill
---

### Query Builder
>
```python
class distill.utils.query_builder.QueryBuilder(query=None)
```

> **Bases:** object

#### add_filters(filters)

#### add_sorting(sort_field='', sort_order='')

### Exception Handling
>
```python
exception distill.utils.exceptions.Error
```

> **Bases:** exceptions.Exception

> Base class for exceptions.

>
```python
exception distill.utils.exceptions.ValidationError(url, msg)
```

> **Bases:** distill.utils.exceptions.Error

> Exceptions raised for errors in validated a url.

### Validation Library
>
```python
distill.utils.validation.str2bool(v)
```

> Convert string expression to boolean

> **Parameters:**
- v – Input value

> **Returns:**
- Converted message as boolean type
- Return type:	bool

>
```python
distill.utils.validation.validate_request(q)
```

> Parse out request message and validate inputs

> **Parameters:**
- q – Url query string

> **Raises:**
- ValidationError – if the query is missing required parameters
