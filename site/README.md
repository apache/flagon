How to Build and Deploy Site
----------------------------

1. Download and Install [``Docker``](http://docker.com)
2. Build site
    ```
    docker build -t senssoft:site .
    ```
3. Deploy site on localhost:8000
    ```
    docker run -p 8000:8000 -it senssoft:site python -m SimpleHTTPServer 
    ```
4. (Optional): To update the site, can copy the files from the container to _site.
    ```
    # First grab container id
    CID=$(docker create -p 8000:8000 -it senssoft:site python -m SimpleHTTPServer)
    # Reference container id to grab built contents
    docker cp $CID:/app/_site .
    # Copy the Website source to the deploy directory
    cp -r _site/* ../content/
    ```
5. N.B. Make sure that any Website changes which are to be deployed to production are pushed
   to the **asf-site** branch.
