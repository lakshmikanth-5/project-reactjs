
pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    environment {
        DOCKERHUB_REPO = 'laxmikanth5/reactjs-springboot'

        AWS_REGION = 'us-east-1'
        ECR_REGISTRY = '658424926696.dkr.ecr.us-east-1.amazonaws.com'
        ECR_REPO = 'devops25/frontend-reactjs'
    }

    stages {

        stage('Docker Image Build') {
            steps {
                sh '''
                    docker build \
                        -t reactjs-node:v${BUILD_NUMBER} \
                        .
                '''
            }
        }

        stage('DockerHub Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker_cred_token',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        set +x
                        echo "$DOCKER_PASS" | docker login \
                            -u "$DOCKER_USER" \
                            --password-stdin
                    '''
                }
            }
        }

        stage('DockerHub Tagging') {
            steps {
                sh '''
                    docker tag \
                        reactjs-node:v${BUILD_NUMBER} \
                        ${DOCKERHUB_REPO}:reactjs-v${BUILD_NUMBER}
                '''
            }
        }

        stage('Push Image to DockerHub') {
            steps {
                sh '''
                    docker push \
                        ${DOCKERHUB_REPO}:reactjs-v${BUILD_NUMBER}
                '''
            }
        }

        stage('Push Image to ECR') {
            steps {
                sh '''
                    set -e

                    echo "Logging into AWS ECR..."

                    aws ecr get-login-password \
                        --region ${AWS_REGION} |
                    docker login \
                        --username AWS \
                        --password-stdin ${ECR_REGISTRY}

                    echo "Tagging image for ECR..."

                    docker tag \
                        reactjs-node:v${BUILD_NUMBER} \
                        ${ECR_REGISTRY}/${ECR_REPO}:reactjs-v${BUILD_NUMBER}

                    echo "Pushing image to ECR..."

                    docker push \
                        ${ECR_REGISTRY}/${ECR_REPO}:reactjs-v${BUILD_NUMBER}

                    echo "ECR push completed successfully."
                '''
            }
        }
    }

    post {

        always {
            slackSend(
                channel: '#all-project25',
                message: """
                    Job: ${env.JOB_NAME}
                    Build: #${env.BUILD_NUMBER}
                    Status: ${currentBuild.currentResult}
                    URL: ${env.BUILD_URL}
                """,
                teamDomain: 'project25-world',
                tokenCredentialId: 'slack-token'
            )
        }

        cleanup {
            cleanWs()
        }
    }
}
