#!/bin/bash

# Print each command, and exit immediately if any command fails
set -ex

# Do port forwarding for `npm run start` but not other commands
# This lets us run builds and such while we have the dev server running
if [[ "$*" =~ ^"npm run start".* ]]; then
  PORT_FORWARD="-p 1313:1313"
fi

DOCKER_IMAGE=us.gcr.io/kubernetes-242623/webdev-docker:master

docker pull -q $DOCKER_IMAGE

docker run -it --rm -u $(id -u):$(id -g) -v $(pwd):/src -w /src $PORT_FORWARD $DOCKER_IMAGE $@
