# Code.gov Harvester
[![CircleCI](https://circleci.com/gh/GSA/code-gov-harvester/tree/master.svg?style=svg&circle-token=373dfb7b6faa8913c9b4c1e292c4638614e3db21)](https://circleci.com/gh/GSA/code-gov-harvester/tree/master)
[![Maintainability](https://api.codeclimate.com/v1/badges/d2c7b46b5646bf674802/maintainability)](https://codeclimate.com/github/GSA/code-gov-harvester/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/d2c7b46b5646bf674802/test_coverage)](https://codeclimate.com/github/GSA/code-gov-harvester/test_coverage)

___This is still a work in progress___

This project fetches and processes `code.json` files and indexes them in Elasticsearch. This is meant to be the main harvester for [Code.gov](https://code.gov) and the [Code.gov API](https://github.com/gsa/code-gov-api).

## How to use this project

### Installing
Please install the following dependencies before running this project:

* Node.js
* Elasticsearch

Once node is installed, install the local npm dependencies

cd code-gov-harvester && npm install

#### Dependencies

#### Development Dependencies

## Running

#### Environment Variables

Before running any of the commands included in the package.json file there are some environment variables that need to be set:
* NODE_ENV: The node environment the project is running under. Valid environments are:
  * `production` or `prod`
  * `staging` or `stag`
  * `development` or `dev`
#### Metadata Files

#### Configuring

#### Scripts

#### Elasticsearch

#### Docker

To be added soon.


## Contributing

Here’s how you can help contribute to code.gov:

- Source Code Policy

  - To provide feedback on the [Federal Source Code Policy](https://sourcecode.cio.gov/), follow [this issue tracker](https://github.com/WhiteHouse/source-code-policy/issues)

- Code.gov
  - To provide feedback on code-gov-harvester, please checkout our [Contributing Guildelines](CONTRIBUTING.md).
  - To contribute to the Code.gov data, go to the [code-gov-data] repo at (https://github.com/GSA/code-gov-data)
  - Checkout [code-gov](https://github.com/GSA/code-gov) for a list of additional project repositories. If you aren't sure where your question or idea fits, this is a good place to share it.

## Generating License Data

To update the `dependency_licenses.json` file, run `npm run licenses`.

## License

As stated in [CONTRIBUTING](CONTRIBUTING.md):

> [..] this project is in the worldwide public domain (in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/)).

> All contributions to this project will be released under the CC0
> dedication. By submitting a pull request, you are agreeing to comply
> with this waiver of copyright interest.
