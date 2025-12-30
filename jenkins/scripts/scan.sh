#!/bin/bash

# Security scan script for Jenkins
echo "Starting security scan..."

# Install Trivy if not available
if ! command -v trivy &> /dev/null; then
    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
fi

# Scan images
echo "Scanning posts-service..."
trivy image --exit-code 0 --no-progress --format json projet-micro-posts-service:$BUILD_NUMBER > trivy-posts.json

echo "Scanning graphql-service..."
trivy image --exit-code 0 --no-progress --format json projet-micro-graphql-service:$BUILD_NUMBER > trivy-graphql.json

echo "Scanning chat-service..."
trivy image --exit-code 0 --no-progress --format json projet-micro-chat-service:$BUILD_NUMBER > trivy-chat.json

echo "Scanning consumers..."
trivy image --exit-code 0 --no-progress --format json projet-micro-kafka-consumers-notifications:$BUILD_NUMBER > trivy-notifications.json
trivy image --exit-code 0 --no-progress --format json projet-micro-kafka-consumers-stories:$BUILD_NUMBER > trivy-stories.json

# Check for critical vulnerabilities
if trivy image --exit-code 1 --severity CRITICAL projet-micro-posts-service:$BUILD_NUMBER; then
    echo "Critical vulnerabilities found in posts-service"
    exit 1
fi

if trivy image --exit-code 1 --severity CRITICAL projet-micro-graphql-service:$BUILD_NUMBER; then
    echo "Critical vulnerabilities found in graphql-service"
    exit 1
fi

if trivy image --exit-code 1 --severity CRITICAL projet-micro-chat-service:$BUILD_NUMBER; then
    echo "Critical vulnerabilities found in chat-service"
    exit 1
fi

if trivy image --exit-code 1 --severity CRITICAL projet-micro-kafka-consumers-notifications:$BUILD_NUMBER; then
    echo "Critical vulnerabilities found in notifications-consumer"
    exit 1
fi

if trivy image --exit-code 1 --severity CRITICAL projet-micro-kafka-consumers-stories:$BUILD_NUMBER; then
    echo "Critical vulnerabilities found in stories-consumer"
    exit 1
fi

echo "Security scan completed"