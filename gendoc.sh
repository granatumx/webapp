#!/usr/bin/env bash

docker run --rm -v `pwd`:/tmp/try -v /var/run/docker.sock:/var/run/docker.sock -it granatumx/doc:1.0.0 doconce format pandoc /tmp/try/README.do.txt --github_md;
rm -rf README.dlog
