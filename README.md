# Code.gov Harvester

___This is still a work in progress___

This project fetches and processes `code.json` files and indexes them in Elasticsearch. This is ment to be the main harvester for [Code.gov](https://code.gov) and the [Code.gov API](https://github.com/gsa/code-gov-api).

## How to use this project

### Installing

Please install the following dependencies before running this project:

* Node.js
* Elasticsearch

Once node is installed, install the local npm dependencies

cd code-gov-harvester && npm install

#### Dependencies

#### Development Dependencies

### Running

#### Environment Variables

Before running any of the commands included in the package.json file there are some environment variables that need to be set:

- NODE_ENV: The node environment the project is running under. Valid environments are:
  - `production` or `prod`
  - `staging` or `stag`
  - `development` or `dev`
- ELASTICSEARCH_SERVICE_NAME: This is used for Cloud.gov deployments and is not needed for local use
- LOGGER_LEVEL: The level to which messages are logged. Eg. _info_, _debug_, _warning_
- GET_REMOTE_METADATA: This indicates whether or not to fetch the metadata needed from a remote location.
- GET_GITHUB_DATA: Variable indicating if GitHub repo data is going to be collected.
- REMOTE_METADATA_LOCATION: The remote location where to find the project's metadata. The default is Code.gov's metadata file, stored in GitHub.
- GITHUB_API_KEY: This is the API key to use. There is no global key. We recommend using a Personal Access Token (PAT) for your key.
- ES_URI: The URI for the Elasticsearch service.

#### Metadata Files

#### Scripts

#### Elasticsearch

#### Docker

It's recommended to use [docker-compose](https://docs.docker.com/compose/) when working with Docker in this project. The [docker-compose.yml](docker-compose.yml) has everything setup to run the harvester as is with Elasticsearch.

To execute you just need:

```shell
> docker-compose up
```

This will build a Docker image for the harvester, download and initialize an Elasticsearch container, and setup the communication between them.

To build a Docker image:

```shell
> docker-compose build .

or

> docker-compose build harvester
```

If you wish to change the configuration of the Docker image please take a look at the [Dockerfile](Dockerfile). Take a look at the [Docker docs](https://docs.docker.com/) for more on how to use Docker.

#### Docker Environment Variables

Some environment variables are needed to use this project with Docker. If you look at the project's [Dockerfile](Dockerfile) or the [Environment Variables](#environment-variables) section of this README, you can see the variables that are used.

The minimum set of variables needed to be set are:

- NODE_ENV
- LOGGER_LEVEL
- GET_GITHUB_DATA
- REMOTE_METADATA_LOCATION
- GITHUB_API_KEY

These variables are used in [config/index.js](config/index.js).

When using [docker-compose](https://docs.docker.com/compose/) you will see a `environment` section. These are the environment variables being set for the __docker-compose__ environment. It is recommended to change these values to whatever you need in your environment or to whatever you want to test.

### Configuring

## Contributing
