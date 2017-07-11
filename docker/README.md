How to Build Docker Containers
------------------------------

1. Install [``Docker``](http://docker.com)
2. Install ``docker-compose``.
    ```
    $ mkdir env
    $ virtualenv env
    $ source env/bin/activate 
    $ pip install -e .[docker]
    ```
3. Build and run all ``Docker`` containers.
    ```
    $ docker-compose up -d
    ```
4. Run a specific ``Docker`` container.
    ```
    $ docker-compose up -d site
    # Note: site container is instrumented w/ userale; all userale logs will be sent to the
    # elasticsearch docker container. 
    ```
5. Verify the deployment by navigating to ``Kibana`` in your favorite browser.
    ```sh
    http://localhost:5601
    ```
    
6. Stop all the containers.
    ```sh
    $ docker-compose stop 
    ```