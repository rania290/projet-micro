# Chat Service

gRPC service for real-time chat functionality in the social network.

## Features

- Send messages between users
- Real-time message streaming via gRPC
- Message persistence in MongoDB
- Kafka integration for notifications
- Bi-directional communication

## gRPC Methods

### ChatService

- `SendMessage` - Send a message to another user
- `SubscribeToMessages` - Subscribe to receive messages in real-time

## Protocol Buffer

See `chat.proto` for the complete service definition.

## Environment Variables

See `.env.example` for required environment variables.

## Running Locally

```bash
npm install
npm start
```

## Docker

```bash
docker build -t chat-service .
docker run -p 50051:50051 chat-service
```

## Testing with gRPC

Use tools like `grpcui` or `grpcurl` to test the service:

```bash
grpcui -plaintext localhost:50051
```