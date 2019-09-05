---
title: Getting Started
component: distill
priority: 1
---

#### This project is not currently maintained and will be refactored. If you are interested in Distill, join the discussion on our [dev list](mailto:dev-subscribe@flagon.incubator.apache.org).

### Usage

Using curl:

  ```shell
  $ curl -XGET 'http://localhost:8090/app/register' -d '{
          "application_name" : "my_app",
          "version" : "0.1",
          "application_description" : "my test app"
  }'
  ```
