Licensed to the Apache Software Foundation (ASF) under one or more
contributor license agreements.  See the NOTICE file distributed with
this work for additional information regarding copyright ownership.
The ASF licenses this file to You under the Apache License, Version 2.0
(the "License"); you may not use this file except in compliance with
the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. 

## v0.1.0 (2023-09-21)

### Refactor

- **Makefile**: run pre-commit hooks prior to commitizen

## 0.0.6 (2023-08-18)

- Migrate package and build management to poetry
- Remove deprecated setup code

## 0.0.5 (2017-06-30)

- Updated elasticsearch-dsl to 5.4.1
- Removed all support for UserALE 3.0
- General cleanup

## 0.0.4 (2016-09-19)

- Moved to Apache.
- Updated all documentation.
- Added License headers
- Docker compose file added to assist deployment of ELK stack with Distill

## 0.0.3 (2016-07-22)

- Moved CRUD operations from UserAle model to Brew model.
- Added API specs to segment UserAle data from Elasticsearch
- Added deployment instructions 

## 0.0.2 (2016-06-14)

- Completed index route for status endpoint which lists all applications registered and their document count segmented by type.
- Updated setup.py to reference deploy scripts
- Example configuration to deploy Distill with Gunicorn and Nginx for Linux/Mac users
- Added UserAle and Stout classes.
- Updated requirements.txt for deployment.

## 0.0.1 (2016-04-01)

- Initial alpha release.
