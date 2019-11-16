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
* NODE_ENV: The node environment the project is running under. Valid environments are:
  * `production` or `prod`
  * `staging` or `stag`
  * `development` or `dev`
#### Metadata Files

#### Scripts

#### Elasticsearch

#### Docker

A docker-compose file has been added for convience. To run a dockerized version of the harvester, the standard `npm install` must be ran first; the files are copied into the container from the host.
Then, running `docker-compose up` will start the container.

This `docker-compose` file includes an elasticsearch configuration running on port 9200.

### Configuring

## Contributing
