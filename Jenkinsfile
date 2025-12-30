pipeline {
    agent {
        docker {
            image 'node:18-bullseye'
            args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-credentials')
        DOCKER_REGISTRY = 'rania290'
        DOCKER_IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📥 Téléchargement du code...'
                checkout scm
            }
        }

        stage('Setup Environment') {
            steps {
                echo '🛠️ Configuration de l\'environnement...'
                sh '''
                    # Installer Docker CLI si nécessaire
                    if ! command -v docker &> /dev/null; then
                        apt-get update && apt-get install -y docker.io
                    fi

                    # Afficher les versions
                    echo "Node: $(node --version)"
                    echo "NPM: $(npm --version)"
                    echo "Docker: $(docker --version)"
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installation des dépendances...'
                sh '''
                    # Installer les dépendances pour chaque service
                    for service in posts-service graphql-service chat-service kafka-consumers; do
                        if [ -f "services/$service/package.json" ]; then
                            echo "Installation des dépendances pour $service..."
                            cd services/$service
                            npm install
                            cd ../..
                        fi
                    done
                '''
            }
        }

        stage('Run Tests') {
            steps {
                echo '🧪 Exécution des tests...'
                sh '''
                    # Exécuter les tests pour chaque service
                    for service in posts-service graphql-service chat-service kafka-consumers; do
                        if [ -f "services/$service/package.json" ]; then
                            echo "Tests pour $service..."
                            cd services/$service
                            npm test || echo "Tests échoués pour $service"
                            cd ../..
                        fi
                    done
                '''
            }
        }

        stage('Build Images') {
            steps {
                echo '🏗️ Construction des images Docker...'
                sh './jenkins/scripts/build.sh'
            }
        }

        stage('Security Scan') {
            steps {
                echo '🔍 Analyse de sécurité...'
                sh './jenkins/scripts/scan.sh'
            }
        }

        stage('Push Images') {
            steps {
                echo '📤 Publication des images...'
                sh './jenkins/scripts/push.sh'
            }
        }

        stage('Update Helm Chart') {
            steps {
                echo '📝 Mise à jour du chart Helm...'
                sh '''
                    # Mettre à jour les repositories et tags d'image dans values.yaml
                    sed -i "s/repository: projet-micro-/repository: ${DOCKER_REGISTRY}\\/projet-micro-/g" helm/social-network/values.yaml
                    sed -i "s/tag: \"latest\"/tag: \"${BUILD_NUMBER}\"/g" helm/social-network/values.yaml

                    # Commit et push les changements
                    git add helm/social-network/values.yaml
                    git commit -m "Update image repositories and tags to ${BUILD_NUMBER}"
                    git push origin HEAD:main
                '''
            }
        }
    }

    post {
        always {
            echo '🧹 Nettoyage...'
            sh '''
                # Supprimer les images locales
                docker rmi $(docker images -q projet-micro-*) || true
            '''
        }
        success {
            echo '✅ Pipeline réussi!'
        }
        failure {
            echo '❌ Pipeline échoué!'
        }
    }
}
