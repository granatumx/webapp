> webapp is an image that provides the frontend for GranatumX



### Prerequisites

You mainly need a working copy of [Docker](http://docker.com). It is used
exclusively to manage system configurations for running numerous tools
across numerous platforms.

### Installation

* All docker images are at "https://hub.docker.com/u/granatumx".
* All github repos are at "https://github.com/granatumx/*".

First set up your scripts and aliases to make things easier. This command should pull the container if
it does not exist locally which facilitates installing on a server.

```
source <( docker run --rm -it granatumx/scripts:1.0.0 gx.sh )
```

### Running

You can run the webapp using the following:

```
$ gx runWebapp.sh
```

You can edit the webapp while the webapp is running using the following which uses `docker exec` to attach
to the running container `gx-webapp`:

```
$ dwebapp
```

Since this re-enters the same running container `gx-webapp`, when you edit a tsx file in the source directory, 
it will do the usual hot-loading that `react` loves to do.

### Displaying errors

You can output errors with the build or launch from the docker host with:

```
$ errwebapp
$ errtaskrunner
$ gxtail
$ gxtailtaskrunner
```

Under the hood, this alias kicks off a docker run of the `scripts` image which runs a shell script `errWebapp.sh`.
This shell script in turn kicks of a docker image via a sibling process to cat the `/var/granatum/err-webapp.log`.
This log file exists on the docker volume `gx` which is attached when sibling process is run.

You can `cat` these errors directly if you are developing within the running `gx-webapp` container.



