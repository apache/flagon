How to Build and Deploy Site
----------------------------

1. Download and Install [``Docker``](http://docker.com)
2. Build site
    ```
    docker build -t flagon:site .
    ```
3. Deploy site on localhost:8000
    ```
    docker run -p 8000:8000 -it flagon:site python -m SimpleHTTPServer 
    ```
4. (Optional): To update the site, can copy the files from the container to `_site`.
    ```
    # First grab container id
    CID=$(docker create -p 8000:8000 -it flagon:site python -m SimpleHTTPServer)
    # Reference container id to grab built contents
    docker cp $CID:/app/_site .
    ```
    Then copy files from `_site` in `/site` folder into `/contents` folder.
    
    Merge new website mods at **master** branch with **asf-site** branch to push changes live.