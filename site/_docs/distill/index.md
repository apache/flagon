---
title: Installation
component: distill
permalink: /docs/distill/
priority: 0
---

### Installing Apache Distill

#### This project is not currently maintained and will be refactored. If you are interested in Distill, join the discussion on our [dev list](mailto:dev-subscribe@flagon.incubator.apache.org).

The first step is to install Apache Distill. First, checkout the latest version of Apache Distill.

  ```shell
  $ git clone https://gitbox.apache.org/repos/asf/incubator-flagon-distill.git
  ```

Apache Distill is a python project, so it can be installed like any other python library. Several operating systems (Mac OS X, Major Versions of Linux/BSD) have Python pre-installed, so you should just have to run

  ```shell
  $ easy_install distill
  ```

      or

  ```shell
  $ pip install distill
  ```

Users are strongly recommended to install Apache Distill in a virtualenv. Instructions to setup an virtual environment will be explained below.

> **Note**
When the package is installed via easy_install or pip this function will be bound to the distill executable in the Python installation’s bin directory (on Windows - the Scripts directory).

### Installing Apache Distill in an Virtual Environment

virtualenv is a tool to create isolated Python environments. virtualenv creates a folder which contains all the necessary executables to use the packages that the Apache Distill project would need.

Install virtualenv via pip:

  ```shell
  $ sudo env/bin/pip install virtualenv
  ```

Start by changing directory into the root of Apache Distill’s project directory, and then use the virtualenv command-line tool to create a new environment:

  ```shell
  $ mkdir env
  $ virtualenv env
  ```

Activate environment:

  ```shell
  $ source env/bin/activate
  ```

Install Apache Distill requirements:

  ```shell
  $ env/bin/pip -r requirements.txt
  ```

To build the source code and run all unit tests.

  ```shell
  $ env/bin/python setup.py develop test
  ```

Launch local Apache Distill server, running on localhost:8090:

  ```shell
  $ env/bin/dev
  ```

Deactivate environment

  ```shell
  $ deactivate
  ```

### Running Apache Distill on Docker Compose
From the project directory, start up Apache Distill in the background.

  ```shell
  $ docker-compose up -d
  $ docker-compose ps
  ```

To stop services once you’ve finished with them:

  ```shell
  $ docker-compose stop
  ```

### Deployment with Nginx and Gunicorn

I will describe a setup with nginx as a web server on Ubuntu. A web server cannot communicate directly with a Flask application such as Apache Distill. Thus gunicorn will be used to act as a medium between the web server and Apache Distill. Gunicorn is like an application web server that will be running behind nginx, and it is WSGI compatible. It can communicate with applications that support WSGI – Flask, Django, etc.

Install requirements.

  ```shell
  $ sudo apt-get update
  $ sudo apt-get install -y python python-pip nginx gunicorn
  ```

Create a directory to store the project.

  ```shell
  $ sudo mkdir /home/pubic_html && cd /home/public_html
  ```

Download the project from the GitHub repository and copy the application to the /home/public_html directory.

  ```shell
  $ git clone https://gitbox.apache.org/repos/asf/incubator-flagon-distill.git /home/public_html
  ```

Install Apache Distill’s requirements either globally or in a virutal environment:

  ```shell
  $ env/bin/pip install -r requirements.txt
  ```

Apache Distill has provided an nginx configuration file located in distill/deploy/nginx.conf.

Gunicorn will use port 8000 and handle the incoming HTTP requests.

Restart nginx to load the configuration changes.

  ```shell
  $ sudo /etc/init.d/nginx restart
  ```

Run gunicorn on port 8000.

  ```shell
  $ gunicorn --workers 4 --bind unix:distill.sock -m 007 deploy/run_server:app
  ```

Start a new browser instance and navigate to http://localhost.

### Installing Documentation

If you want to manually build the documentation, the instructions are below.

First, install the documentation dependencies:

  ```shell
  $ env/bin/pip install -r doc_requirements.txt
  ```

To build Apache Distill’s documentation, create a directory at the root level of /distill called distill-docs.

  ```shell
  $ mkdir distill-docs & cd distill-docs
  ```

Execute build command:

  ```shell
  # Inside top-level docs/ directory.
  $ make html
  ```

This should build the documentation in your shell, and output HTML. At then end, it should say something about documents being ready in distill-docs/html. You can now open them in your browser by typing

  ```shell
  $ open distill-docs/html/index.html
  ```
