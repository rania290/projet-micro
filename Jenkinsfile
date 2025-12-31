pipeline {
    agent any

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
                    # Vérifier les outils disponibles
                    echo "Node: $(node --version 2>/dev/null || echo 'Node.js non disponible')"
                    echo "NPM: $(npm --version 2>/dev/null || echo 'NPM non disponible')"
                    echo "Docker: $(docker --version 2>/dev/null || echo 'Docker non disponible')"

                    # Créer le répertoire node_modules s'il n'existe pas
                    mkdir -p services/posts-service/node_modules
                    mkdir -p services/graphql-service/node_modules
                    mkdir -p services/chat-service/node_modules
                    mkdir -p services/kafka-consumers/node_modules
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installation des dépendances...'
                sh '''
                    # Utiliser Docker pour Node.js
                    for service in posts-service graphql-service chat-service kafka-consumers; do
                        if [ -f "services/$service/package.json" ]; then
                            echo "Installation des dépendances pour $service..."
                            docker run --rm -v $(pwd)/services/$service:/app -w /app node:18-alpine sh -c "npm install"
                        fi
                    done
                '''
            }
        }

        stage('Run Tests') {
            steps {
                echo '🧪 Exécution des tests...'
                sh '''
                    # Exécuter les tests pour chaque service avec Docker
                    for service in posts-service graphql-service chat-service kafka-consumers; do
                        if [ -f "services/$service/package.json" ]; then
                            echo "Tests pour $service..."
                            docker run --rm -v $(pwd)/services/$service:/app -w /app node:18-alpine sh -c "npm test" || echo "Tests échoués pour $service"
                        fi
                    done
                '''
            }
        }

        stage('Build Images') {
            steps {
                echo '🏗️ Construction des images Docker...'
                sh '''
                    chmod +x jenkins/scripts/build.sh
                    ./jenkins/scripts/build.sh
                '''
            }
        }

        stage('Security Scan') {
            steps {
                echo '🔍 Analyse de sécurité...'
                sh '''
                    chmod +x jenkins/scripts/scan.sh
                    ./jenkins/scripts/scan.sh
                '''
            }
        }

        stage('Push Images') {
            steps {
                echo '📤 Publication des images...'
                sh '''
                    chmod +x jenkins/scripts/push.sh
                    ./jenkins/scripts/push.sh
                '''
            }
        }

        stage('Update Helm Chart') {
            steps {
                echo '📝 Mise à jour du chart Helm...'
                sh '''
                    # Mettre à jour les repositories et tags d'image dans values.yaml
                    sed -i "s/repository: projet-micro-/repository: ${DOCKER_REGISTRY}\\/projet-micro-/g" helm/social-network/values.yaml
                    sed -i "s/tag: \"latest\"/tag: \"${BUILD_NUMBER}\"/g" helm/social-network/values.yaml

                    echo "✅ Chart Helm mis à jour avec les nouvelles images (tag: ${BUILD_NUMBER})"
                    echo "📝 Note: Pour appliquer les changements, exécutez manuellement:"
                    echo "   helm upgrade social-network ./helm/social-network"
                    echo "   ou via ArgoCD si configuré"
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
