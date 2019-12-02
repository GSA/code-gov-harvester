# Code.gov Harvester
[![CircleCI](https://circleci.com/gh/GSA/code-gov-harvester/tree/master.svg?style=svg&circle-token=373dfb7b6faa8913c9b4c1e292c4638614e3db21)](https://circleci.com/gh/GSA/code-gov-harvester/tree/master)
[![Maintainability](https://api.codeclimate.com/v1/badges/d2c7b46b5646bf674802/maintainability)](https://codeclimate.com/github/GSA/code-gov-harvester/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/d2c7b46b5646bf674802/test_coverage)](https://codeclimate.com/github/GSA/code-gov-harvester/test_coverage)

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

To be added soon.

### Configuring

## Contributing
