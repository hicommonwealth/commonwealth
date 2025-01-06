# Deployment Flow
In order to perform a deployment, we need to push to a branch that corresponds with a heroku application. The branches
are frick, frack, beta. This then runs a github action that takes care of the deployment.

# Deployment Details
We use Heroku for deploying our applications. The deployment process is automated via GitHub Actions using a Continuous Deployment (CD) pipeline. Every time we push changes to a branch associated with a specific app (e.g., frick, frack, beta, etc.), the CD.yml GitHub action is triggered, which initiates the deployment process.

## Deployment Workflow Overview
### Base Container Build:

First, our base container image is built using the following command:
bash
```shell
docker build -f Dockerfile.commonwealth_base -t commonwealth_base .
```
This image contains the core setup required by all of our apps, ensuring consistency and reducing redundancy across different services.
### Individual Process Builds:

After building the base container, the individual process-specific Dockerfiles (e.g., Dockerfile.web, Dockerfile.evm_ce) are built and pushed to Heroku using the following command:
bash
```shell
heroku container:push --recursive -a ${heroku_app_name}
```
The --recursive flag ensures that all defined processes (web, consumer, evm_ce, etc.) are built and pushed to the appropriate Heroku app.
### Release on Heroku:

After the container images are successfully pushed, the next step is to release these images to Heroku:
```shell
heroku container:release web evm_ce consumer message_relayer knock -a ${heroku_app_name}
```
This command releases the defined processes to their respective dynos on Heroku, making the application live.