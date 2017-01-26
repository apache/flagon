---
title: Getting Started
component: system
permalink: /docs/system/
priority: 0
---

The Apache SensSoft system provides a simple, ready-to-go deployment.  The deployment is containerized with Docker.  It includes the UserALE backend, Distill, and Tap.  It requires [Docker Compose](https://docs.docker.com/compose/install/) to be installed and working.

### Configure Tap

Tap, as a Django project, requires a secret.py file to run.  Before you begin, create and add the file to /docker/tap/

  ```python
  """
  Secret Django settings for tap project.
  """

  # SECURITY WARNING: keep the secret key used in production secret!
  MY_SECRET_KEY = '<yoursecretkey>'
  MY_DB_NAME = 'tapdb'
  MY_DB_USER = 'tapuser'
  MY_DB_PASSWORD = '<dbpassword>'
  MY_DB_HOST = 'db'

  MY_EMAIL_PASSWORD =''
  ADMIN_EMAILS = ()
  ```

### Install and Run with Docker Compose

To build and start the system:

  ```shell
  docker-compose build
  docker-compose up
  ```

Tap will be running at localhost:8000.

To shut down the system:

  ```shell
  docker-compose down
  ```
