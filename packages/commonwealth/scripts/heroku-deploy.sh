#!/bin/bash

echo "Logging in to AWS ECR..."
aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com

IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${REPOSITORY_NAME}:${COMMIT_HASH}"

echo "Pulling Docker image $IMAGE_URI..."
docker pull $IMAGE_URI

docker run -d -p 8080:8080 $IMAGE_URI
CONTAINER_ID=$(docker run -d -p 8080:8080 $IMAGE_URI)
