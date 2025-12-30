#!/bin/bash

# Build script for Jenkins
echo "Starting build process..."

# Build Docker images
docker build -f services/posts-service/Dockerfile -t projet-micro-posts-service:$BUILD_NUMBER services/posts-service
docker build -f services/graphql-service/Dockerfile -t projet-micro-graphql-service:$BUILD_NUMBER services/graphql-service
docker build -f services/chat-service/Dockerfile -t projet-micro-chat-service:$BUILD_NUMBER services/chat-service
docker build -f services/kafka-consumers/Dockerfile.notifications -t projet-micro-kafka-consumers-notifications:$BUILD_NUMBER services/kafka-consumers
docker build -f services/kafka-consumers/Dockerfile.stories -t projet-micro-kafka-consumers-stories:$BUILD_NUMBER services/kafka-consumers

echo "Build completed successfully"
