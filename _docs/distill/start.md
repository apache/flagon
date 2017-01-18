---
title: Getting Started
component: distill
priority: 1
---

### Usage

Using curl:

  ```shell
  $ curl -XGET 'http://localhost:8090/app/register' -d '{
          "application_name" : "my_app",
          "version" : "0.1",
          "application_description" : "my test app"
  }'
  ```
