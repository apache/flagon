How to Build and Deploy Site
----------------------------

1. Download and Install [``Docker``](http://docker.com)
2. Build site
    ```
    docker build -t flagon:site .
    ```
3. Deploy site on localhost:8000
    ```
    docker run -p 8000:8000 -it flagon:site python -m http.server
    ```
