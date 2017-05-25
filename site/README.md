How to Build Site
-----------------

1. Download and Install [``Docker``](http://docker.com)
2. Build site
    ```
    docker build -t apache-site .
    ```
3. Deploy site on localhost:8000
    ```
    docker run -p 8000:8000 -it apache-site python -m SimpleHTTPServer 
    ```