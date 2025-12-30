# Social Network Microservices Helm Chart

This Helm chart deploys a complete social network microservices application on Kubernetes.

## Architecture

The application consists of the following microservices:

- **Posts Service**: REST API for managing posts (Node.js/Express)
- **GraphQL Service**: GraphQL API gateway (Apollo Server)
- **Chat Service**: gRPC chat service
- **Kafka Consumers**: Background workers for processing events
- **MongoDB**: Document database
- **Kafka**: Message broker with Zookeeper
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- kubectl configured to access your cluster

## Installing the Chart

### From local directory

```bash
# Clone the repository
git clone <repository-url>
cd projet-micro

# Install the chart
helm install social-network ./helm/social-network
```

### With custom values

```bash
# Install with custom release name
helm install my-social-network ./helm/social-network \
  --set postsService.replicaCount=3 \
  --set graphqlService.service.type=LoadBalancer
```

## Configuration

The following table lists the configurable parameters of the social-network chart and their default values.

### Global Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.namespace` | Namespace for all resources | `social-network` |

### Posts Service

| Parameter | Description | Default |
|-----------|-------------|---------|
| `postsService.enabled` | Enable posts service | `true` |
| `postsService.image.repository` | Posts service image | `projet-micro-posts-service` |
| `postsService.image.tag` | Posts service image tag | `latest` |
| `postsService.replicaCount` | Number of replicas | `2` |
| `postsService.port` | Service port | `3020` |
| `postsService.service.type` | Service type | `ClusterIP` |

### GraphQL Service

| Parameter | Description | Default |
|-----------|-------------|---------|
| `graphqlService.enabled` | Enable GraphQL service | `true` |
| `graphqlService.image.repository` | GraphQL service image | `projet-micro-graphql-service` |
| `graphqlService.image.tag` | GraphQL service image tag | `latest` |
| `graphqlService.replicaCount` | Number of replicas | `2` |
| `graphqlService.port` | Service port | `4000` |
| `graphqlService.service.type` | Service type | `LoadBalancer` |

### Chat Service

| Parameter | Description | Default |
|-----------|-------------|---------|
| `chatService.enabled` | Enable chat service | `true` |
| `chatService.image.repository` | Chat service image | `projet-micro-chat-service` |
| `chatService.image.tag` | Chat service image tag | `latest` |
| `chatService.replicaCount` | Number of replicas | `2` |
| `chatService.port` | Service port | `50051` |
| `chatService.service.type` | Service type | `ClusterIP` |

### Kafka Consumers

| Parameter | Description | Default |
|-----------|-------------|---------|
| `kafkaConsumers.enabled` | Enable Kafka consumers | `true` |
| `kafkaConsumers.image.repository` | Kafka consumers image | `projet-micro-kafka-consumers` |
| `kafkaConsumers.image.tag` | Kafka consumers image tag | `latest` |
| `kafkaConsumers.replicaCount` | Number of replicas | `1` |

### MongoDB

| Parameter | Description | Default |
|-----------|-------------|---------|
| `mongodb.enabled` | Enable MongoDB | `true` |
| `mongodb.image.repository` | MongoDB image | `mongo` |
| `mongodb.image.tag` | MongoDB image tag | `6.0` |
| `mongodb.service.type` | Service type | `ClusterIP` |
| `mongodb.service.port` | Service port | `27017` |

### Kafka

| Parameter | Description | Default |
|-----------|-------------|---------|
| `kafka.enabled` | Enable Kafka | `true` |
| `kafka.image.repository` | Kafka image | `bitnami/kafka` |
| `kafka.image.tag` | Kafka image tag | `3.6` |
| `kafka.service.type` | Service type | `ClusterIP` |
| `kafka.service.port` | Service port | `9092` |

### Prometheus

| Parameter | Description | Default |
|-----------|-------------|---------|
| `prometheus.enabled` | Enable Prometheus | `true` |
| `prometheus.image.repository` | Prometheus image | `prom/prometheus` |
| `prometheus.image.tag` | Prometheus image tag | `v2.45.0` |
| `prometheus.replicaCount` | Number of replicas | `1` |
| `prometheus.port` | Service port | `9090` |
| `prometheus.service.type` | Service type | `ClusterIP` |

### Grafana

| Parameter | Description | Default |
|-----------|-------------|---------|
| `grafana.enabled` | Enable Grafana | `true` |
| `grafana.image.repository` | Grafana image | `grafana/grafana` |
| `grafana.image.tag` | Grafana image tag | `10.1.0` |
| `grafana.adminPassword` | Admin password | `admin123` |
| `grafana.replicaCount` | Number of replicas | `1` |
| `grafana.port` | Service port | `3000` |
| `grafana.service.type` | Service type | `LoadBalancer` |

## Accessing the Application

### GraphQL API
```bash
# Get the GraphQL service URL
kubectl get svc -l app.kubernetes.io/component=graphql-service

# Access GraphQL playground at the service URL
```

### Grafana Dashboard
```bash
# Get the Grafana service URL
kubectl get svc -l app.kubernetes.io/component=grafana

# Login with admin/admin123
```

### Prometheus
```bash
# Get the Prometheus service URL
kubectl get svc -l app.kubernetes.io/component=prometheus

# Access Prometheus UI at the service URL
```

## Development

### Local Development with Docker Compose

```bash
# Start all services locally
docker-compose up -d

# View logs
docker-compose logs -f
```

### Building Images

```bash
# Build all service images
docker build -t projet-micro-posts-service ./services/posts-service
docker build -t projet-micro-graphql-service ./services/graphql-service
docker build -t projet-micro-chat-service ./services/chat-service
docker build -t projet-micro-kafka-consumers ./services/kafka-consumers
```

## Monitoring

The application includes comprehensive monitoring:

- **Prometheus**: Collects metrics from all services
- **Grafana**: Provides dashboards for visualization
- **Health Checks**: Liveness and readiness probes for all services

## Troubleshooting

### Check pod status
```bash
kubectl get pods -l app.kubernetes.io/name=social-network
```

### View logs
```bash
kubectl logs -l app.kubernetes.io/component=posts-service
```

### Check service endpoints
```bash
kubectl get svc -l app.kubernetes.io/name=social-network
```

### Debug with port forwarding
```bash
# Forward GraphQL service
kubectl port-forward svc/social-network-graphql-service 4000:4000

# Forward Grafana
kubectl port-forward svc/social-network-grafana 3000:3000
```

## Upgrading the Chart

```bash
# Upgrade with new values
helm upgrade social-network ./helm/social-network --set postsService.replicaCount=3
```

## Uninstalling the Chart

```bash
# Uninstall the release
helm uninstall social-network

# Clean up PVCs if needed
kubectl delete pvc -l app.kubernetes.io/name=social-network
```

## CI/CD Integration

This chart is designed to work with the included Jenkins pipeline and ArgoCD configuration for automated deployments.

### Jenkins Pipeline
- Builds Docker images
- Runs security scans with Trivy
- Pushes images to registry
- Updates Helm values

### ArgoCD
- GitOps deployment from Git repository
- Automatic synchronization
- Rollback capabilities