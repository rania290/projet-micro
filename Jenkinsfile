pipeline {
    agent any
    
    environment {
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-credentials')
        DOCKER_IMAGE_TAG = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Setup Environment') {
            steps {
                echo '🛠️  Configuration de l’environnement...'
                sh '''
                    # Vérifier et installer Node.js si nécessaire
                    if ! command -v node &> /dev/null; then
                        echo "Installation de Node.js..."
                        apt-get update && apt-get install -y curl
                        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
                        apt-get install -y nodejs
                    fi
                    
                    # Afficher les versions
                    echo "Node: $(node --version 2>/dev/null || echo 'non installé')"
                    echo "NPM: $(npm --version 2>/dev/null || echo 'non installé')"
                    echo "Docker: $(docker --version 2>/dev/null || echo 'non installé')"
                '''
            }
        }
        
        stage('Checkout') {
            steps {
                echo '📥 Téléchargement du code...'
                checkout scm
            }
        }
        
        stage('Verify Project Structure') {
            steps {
                echo '📁 Vérification de la structure...'
                sh '''
                    echo "Fichiers trouvés:"
                    find . -type f -name "package.json" -o -name "Dockerfile*" | sort
                    
                    if [ -f "services/posts-service/package.json" ]; then
                        echo "✅ posts-service/package.json trouvé"
                        cd services/posts-service
                        npm install --only=prod 2>&1 || echo "npm install échoué"
                    else
                        echo "❌ posts-service/package.json non trouvé"
                    fi
                '''
            }
        }
        
        stage('Simple Docker Test') {
            when {
                expression { sh(script: 'docker --version', returnStatus: true) == 0 }
            }
            steps {
                echo '🐳 Test Docker simple...'
                sh 'docker run --rm hello-world || echo "Docker ne peut pas exécuter de conteneurs"'
            }
        }
    }
    
    post {
        always {
            echo '✅ Pipeline terminé'
            sh '''
                echo "=== Résumé ==="
                echo "Build: ${BUILD_NUMBER}"
                echo "Status: ${currentBuild.currentResult}"
            '''
        }
    }
}
