pipeline {
  agent any

    environment {
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-credentials')
        DOCKER_IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo '🔄 Récupération du code...'
                sh 'git pull origin main || echo Code already up to date'
            }
        }

        stage('Run Tests') {
            steps {
                echo '🧪 Exécution des tests...'
                dir('services/posts-service') {
                    sh 'npm ci'
                    sh 'npm test'
                }
                dir('services/graphql-service') {
                    sh 'npm ci'
                    sh 'npm test'
                }
                dir('services/chat-service') {
                    sh 'npm ci'
                    sh 'npm test'
                }
                dir('services/kafka-consumers') {
                    sh 'npm ci'
                    sh 'npm test'
                }
            }
        }

        stage('Build Posts Service') {
            steps {
                dir('services/posts-service') {
                    sh 'docker build -t projet-micro-posts-service:${DOCKER_IMAGE_TAG} .'
                }
            }
        }

        stage('Build GraphQL Service') {
            steps {
                dir('services/graphql-service') {
                    sh 'docker build -t projet-micro-graphql-service:${DOCKER_IMAGE_TAG} .'
                }
            }
        }

        stage('Build Chat Service') {
            steps {
                dir('services/chat-service') {
                    sh 'docker build -t projet-micro-chat-service:${DOCKER_IMAGE_TAG} .'
                }
            }
        }

        stage('Build Kafka Consumers') {
            steps {
                dir('services/kafka-consumers') {
                    sh 'docker build -f Dockerfile.notifications -t projet-micro-kafka-consumers-notifications:${DOCKER_IMAGE_TAG} .'
                    sh 'docker build -f Dockerfile.stories -t projet-micro-kafka-consumers-stories:${DOCKER_IMAGE_TAG} .'
                }
            }
        }

        stage('Security Scan with Trivy') {
            steps {
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasecurity/trivy:latest image --exit-code 0 --no-progress --format table projet-micro-posts-service:${DOCKER_IMAGE_TAG}'
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasecurity/trivy:latest image --exit-code 0 --no-progress --format table projet-micro-graphql-service:${DOCKER_IMAGE_TAG}'
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasecurity/trivy:latest image --exit-code 0 --no-progress --format table projet-micro-chat-service:${DOCKER_IMAGE_TAG}'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh 'echo $DOCKER_HUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_CREDENTIALS_USR --password-stdin'

                sh 'docker tag projet-micro-posts-service:${DOCKER_IMAGE_TAG} ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-posts-service:${DOCKER_IMAGE_TAG}'
                sh 'docker tag projet-micro-graphql-service:${DOCKER_IMAGE_TAG} ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-graphql-service:${DOCKER_IMAGE_TAG}'
                sh 'docker tag projet-micro-chat-service:${DOCKER_IMAGE_TAG} ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-chat-service:${DOCKER_IMAGE_TAG}'
                sh 'docker tag projet-micro-kafka-consumers-notifications:${DOCKER_IMAGE_TAG} ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-kafka-consumers-notifications:${DOCKER_IMAGE_TAG}'
                sh 'docker tag projet-micro-kafka-consumers-stories:${DOCKER_IMAGE_TAG} ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-kafka-consumers-stories:${DOCKER_IMAGE_TAG}'

                sh 'docker push ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-posts-service:${DOCKER_IMAGE_TAG}'
                sh 'docker push ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-graphql-service:${DOCKER_IMAGE_TAG}'
                sh 'docker push ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-chat-service:${DOCKER_IMAGE_TAG}'
                sh 'docker push ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-kafka-consumers-notifications:${DOCKER_IMAGE_TAG}'
                sh 'docker push ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-kafka-consumers-stories:${DOCKER_IMAGE_TAG}'

                sh 'docker tag projet-micro-posts-service:${DOCKER_IMAGE_TAG} ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-posts-service:latest'
                sh 'docker tag projet-micro-graphql-service:${DOCKER_IMAGE_TAG} ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-graphql-service:latest'
                sh 'docker tag projet-micro-chat-service:${DOCKER_IMAGE_TAG} ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-chat-service:latest'
                sh 'docker tag projet-micro-kafka-consumers-notifications:${DOCKER_IMAGE_TAG} ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-kafka-consumers-notifications:latest'
                sh 'docker tag projet-micro-kafka-consumers-stories:${DOCKER_IMAGE_TAG} ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-kafka-consumers-stories:latest'

                sh 'docker push ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-posts-service:latest'
                sh 'docker push ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-graphql-service:latest'
                sh 'docker push ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-chat-service:latest'
                sh 'docker push ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-kafka-consumers-notifications:latest'
                sh 'docker push ${DOCKER_HUB_CREDENTIALS_USR}/projet-micro-kafka-consumers-stories:latest'
            }
        }

        stage('Deploy Simulation') {
            steps {
                echo '🚀 Simulation de déploiement...'
                // Simulation de déploiement - remplacer par la logique réelle
                sh 'echo Déploiement simulé terminé'
            }
        }
    }

    post {
        always {
            echo '🧹 Nettoyage...'
            sh 'docker system prune -f'
            echo 'Nettoyage terminé'
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo '❌ Pipeline échoué !'
        }
    }
}
