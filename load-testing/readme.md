# A Guide to Load Testing

## Understanding the Need for Load Testing

[Load testing](https://github.com/hicommonwealth/commonwealth/wiki/benchmark) is an essential aspect of software testing. It is designed to understand how a system behaves under a specific load, primarily used for identifying bottlenecks and performance issues, while also aiding in determining system scalability.

For the purpose of load testing, we use a tool named [Artillery](https://github.com/artilleryio/artillery). It is a potent, up-to-date tool for testing HTTP, WebSocket, and socket.io backends. It's capable of executing load tests at scale on AWS Fargate, an engine for serverless computing meant for containers that's compatible with both Amazon Elastic Container Service (ECS) and Amazon Elastic Kubernetes Service (EKS). 

This guide will help you set up and perform load tests with Artillery, both on your local machine and AWS.

## Artillery Documentation and Repository Links

- [Artillery GitHub Repository](https://github.com/artilleryio/artillery)  
- [Artillery HTTP Engines](https://www.artillery.io/docs/reference/engines/http)   
- [Artillery Metrics Publishing](https://www.artillery.io/docs/reference/extensions/publish-metrics#datadog)   
- [Artillery on AWS Fargate](https://www.artillery.io/docs/load-testing-at-scale/aws-fargate) 

## Getting Started with Load Testing

### Running Load Tests locally

```bash
cd load-testing
cp env.local.sh .env
yarn install
yarn test-load
```

First, based on `env.local.sh`, we created a `.env` file.
Replace `JWT` token, `USER_ADDRESS` with your own 

```makefile
# ---------------------------
# Scenario Configuration
# ---------------------------
# Environment variable to choose the target URL
ENV=local

# Name of the scenario file (without the .yml extension)
TEST_NAME=commonwealth-api-threads

# Community to test
TEST_COMMUNITY=cmn-protocol

# ID of the thread to open and post during the test
# TEST_THREAD_ID should belong to TEST_COMMUNITY
TEST_THREAD_ID=11875

# ---------------------------
# User Configuration
# ---------------------------
# JWT token for authentication (replace with your JWT token)
JWT=eyJWT

# User address for the test (replace with your address)
USER_ADDRESS=0xAABCDEF

# ---------------------------
# Result Configuration
# ---------------------------
# Directory where the output will be stored (created locally)
REPORT_DIR=output

# ---------------------------
# AWS Configuration
# ---------------------------
# AWS region for the test (acts as a label for the filename if not running on AWS)
TEST_LOCATION=us-east-1

# ---------------------------
# DataDog Configuration (Optional)
# ---------------------------
# DataDog API key (optional)
DD_API_KEY=lldjfs

# DataDog application key (optional)
DD_APP_KEY=lsdfsjsldk

# DataDog site (optional)
DD_SITE=us5.datadoghq.com
```

These tests are executed on your local system but will connect to remote URLs, providing a good performance measure from your actual location.

### Run test metrics to datadog

For running tests and reporting metrics on the new [Artillery Dashobaord](https://us5.datadoghq.com/dashboard/z7m-wbf-b2z/artillery) on Datadog, use:

```bash
yarn test-load-dd
```
This will start a local statsd listener along with artillery and report published statsd results to Datadog. Note that it's still a work in progress.

## Performing Tests on AWS

Testing on AWS allows you to measure performance from different regions, like Europe or Asia, regardless of your physical location.

## AWS Setup - NoSetup - Just logged in account required
- Once you have logged in AWS account on your local terminal it should work given your account have enough permissions.
- No other setup required for running on AWS.

To run the tests on AWS, use:

```bash
yarn test-aws
```

Please note that the `TEST_LOCATION` must be a valid AWS region. The supported regions include us-east-1, us-west-1, eu-west-1, eu-central-1, ap-south-1, and ap-northeast-1.

Unfortunately `ap-south-1` didnt work for me
```
    stoppedReason: 'CannotPullContainerError: pull image manifest has been retried 1 time(s): failed to resolve ref 301676560329.dkr.ecr.ap-south-1.amazonaws.com/artillery-pro/aws-ecs-node:v2-1f676ad7a2ecc923e813cdc7ac1bf4a2328daec0: 301676560329.dkr.ecr.ap-south-1.amazonaws.com/artillery-pro/aws-ecs-node:v2-1f676ad7a2ecc923e813cdc7ac1bf4a2328daec0: not found',
```

If you encounter permission issues, check the IAM role that was created. The permission syntax must be correct. For debugging permissions, refer to [Artillery IAM permissions](https://www.artillery.io/docs/load-testing-at-scale/aws-fargate#iam-permissions).

## Future Plans - Github Action

To use GitHub actions, ensure that a base image with AWS CLI and Node.js is used. Also, ensure that the account is appropriately set up and logged in before setting up these performance tests.

## Resource Usage on AWS

Results of the test run are stored on S3, and a JSON output file is saved locally. Artillery autonomously generates any required infrastructure and deletes it upon completion.

## Visualizing the Results

The results can be visualized by opening the `load-testing/output/report-${ENV}.html` file in your browser.

## Artillery Basics

You're free to experiment with your `test.yml` file. Here are some basic commands to get you started:

```bash
# to run a test
yarn artillery run test.yml

# to generate a report
yarn artillery report --output report.html report.json
```

## Additional Information

Currently, Influx and Grafana aren't in use. However, these tools can be used to set up a local dashboard to read and compare results from different runs, making use of visualizations instead of just output files.

```bash
# to start influx db & grafana
docker-compose up -d
```
