# Example Docker deployment

This directory contains a modified [elk stack](https://github.com/deviantony/docker-elk) along with an instrumented site
to demonstrate how to publish logs to elk.

Prerequisites: Docker engine is running

Run `docker-compose up setup` to initialize and `docker-compose up` to run.

# Apache Flagon - Local Setup Guide

## Introduction
Welcome to the **Apache Flagon** repository! This guide will help you set up the project locally for development and testing.

## Prerequisites
Ensure you have the following dependencies installed before proceeding:

- **Git**
- **Java (JDK 8 or later)**
- **Maven**
- **Node.js & npm** (for front-end development)
- **Python 3.x** (for analytics tools)
- **Docker** (if you plan to use development container services)

### Check Installed Versions
Run the following commands to verify your setup:

```bash
java -version
mvn -version
node -v
npm -v
python3 --version
docker --version
```

## Fork and Clone the Repository

```bash
git clone https://github.com/<username>/flagon.git
cd flagon
```

## Build the Project

```bash
mvn clean install
```

## Run the Application

```bash
mvn spring-boot:run
```

```Or Run the Application in Docker```

```bash
docker-compose up --build
```
## Access the Application

```http://localhost:8080```

## Contribution Setup
- Create a new branch for your changes

```bash
git checkout -b feature/my-feature
```

- Commit your changes

```bash
git add .
git commit -m "Add my feature"
```

- Push your changes

```bash
git push origin feature/my-feature
```