#!/bin/bash

# Push script for Jenkins
echo "Starting push process..."

# Login to Docker Hub
echo $DOCKER_HUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_CREDENTIALS_USR --password-stdin

# Tag and push images
docker tag projet-micro-posts-service:$BUILD_NUMBER $DOCKER_REGISTRY/projet-micro-posts-service:$BUILD_NUMBER
docker tag projet-micro-graphql-service:$BUILD_NUMBER $DOCKER_REGISTRY/projet-micro-graphql-service:$BUILD_NUMBER
docker tag projet-micro-chat-service:$BUILD_NUMBER $DOCKER_REGISTRY/projet-micro-chat-service:$BUILD_NUMBER
docker tag projet-micro-kafka-consumers-notifications:$BUILD_NUMBER $DOCKER_REGISTRY/projet-micro-kafka-consumers-notifications:$BUILD_NUMBER
docker tag projet-micro-kafka-consumers-stories:$BUILD_NUMBER $DOCKER_REGISTRY/projet-micro-kafka-consumers-stories:$BUILD_NUMBER

docker push $DOCKER_REGISTRY/projet-micro-posts-service:$BUILD_NUMBER
docker push $DOCKER_REGISTRY/projet-micro-graphql-service:$BUILD_NUMBER
docker push $DOCKER_REGISTRY/projet-micro-chat-service:$BUILD_NUMBER
docker push $DOCKER_REGISTRY/projet-micro-kafka-consumers-notifications:$BUILD_NUMBER
docker push $DOCKER_REGISTRY/projet-micro-kafka-consumers-stories:$BUILD_NUMBER

# Also push latest
docker tag projet-micro-posts-service:$BUILD_NUMBER $DOCKER_REGISTRY/projet-micro-posts-service:latest
docker tag projet-micro-graphql-service:$BUILD_NUMBER $DOCKER_REGISTRY/projet-micro-graphql-service:latest
docker tag projet-micro-chat-service:$BUILD_NUMBER $DOCKER_REGISTRY/projet-micro-chat-service:latest
docker tag projet-micro-kafka-consumers-notifications:$BUILD_NUMBER $DOCKER_REGISTRY/projet-micro-kafka-consumers-notifications:latest
docker tag projet-micro-kafka-consumers-stories:$BUILD_NUMBER $DOCKER_REGISTRY/projet-micro-kafka-consumers-stories:latest

docker push $DOCKER_REGISTRY/projet-micro-posts-service:latest
docker push $DOCKER_REGISTRY/projet-micro-graphql-service:latest
docker push $DOCKER_REGISTRY/projet-micro-chat-service:latest
docker push $DOCKER_REGISTRY/projet-micro-kafka-consumers-notifications:latest
docker push $DOCKER_REGISTRY/projet-micro-kafka-consumers-stories:latest

echo "Push completed successfully"
