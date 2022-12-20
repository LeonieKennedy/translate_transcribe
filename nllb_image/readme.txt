To get this up and running, on an internet connected machine with docker:
- Build the image e.g. in the nllb_image folder run sudo docker build -t nllb:latest .
- Run the image and check that it's working e.g. sudo docker run -p 8000:8000 -d nllb:latest
- At this point, the container will need a few minutes to download the language model from the internet. This may take some time.
- Navigate a browser to the ip of the box that the container is running on and go to /docs e.g. http://10.1.20.31:8000/docs
- Test out the API and check that it's working as expected.
- Assuming it's all working, you can commit the running container to an image e.g. sudo docker commit <container_name> nllb-cached:latest
- This image can then be saved to an archive to move it to an offline box e.g. sudo docker save nllb-cached:latest | gzip > nllb-cached-image.tar.gz
- Once saved, move the image to the system you want to run it on and load it into docker e.g. sudo docker load < nllb-cached-image.tar.gz
- And you should be good to go.
