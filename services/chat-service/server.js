const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { Kafka } = require('kafkajs');
const mongoose = require('mongoose');
const express = require('express');
const promClient = require('prom-client');
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics();
const path = require('path');
require('dotenv').config();

// Load protobuf
const PROTO_PATH = path.join(__dirname, 'chat.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const { chat } = protoDescriptor;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/social-network');

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB from chat-service');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Message Schema
const MessageSchema = new mongoose.Schema({
    text: { type: String, required: true },
    userId: { type: String, required: true },
    targetUserId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', MessageSchema);

// Kafka configuration - CORRECTION ICI
const kafkaBrokers = process.env.KAFKA_BROKERS || 'kafka:29092';
console.log(`Connecting to Kafka brokers: ${kafkaBrokers}`);

const kafka = new Kafka({
    clientId: 'chat-service',
    brokers: [kafkaBrokers]
});

const producer = kafka.producer();

// Chat service implementation
const subscribers = new Map();

const chatService = {
    SendMessage: async (call, callback) => {
        try {
            const { text, userId, targetUserId } = call.request;

            // Save message to MongoDB
            const message = new Message({
                text,
                userId,
                targetUserId
            });
            await message.save();

            // Send notification via Kafka
            await producer.send({
                topic: 'notifications',
                messages: [{
                    value: JSON.stringify({
                        type: 'CHAT_MESSAGE',
                        messageId: message._id,
                        userId,
                        targetUserId,
                        text
                    })
                }]
            });

            // Notify subscriber if online
            const targetSubscriber = subscribers.get(targetUserId);
            if (targetSubscriber) {
                targetSubscriber.write({
                    id: message._id.toString(),
                    text,
                    userId,
                    timestamp: message.timestamp.toISOString()
                });
            }

            callback(null, {
                success: true,
                messageId: message._id.toString()
            });
        } catch (error) {
            console.error('Error sending message:', error);
            callback({
                code: grpc.status.INTERNAL,
                message: 'Error sending message'
            });
        }
    },

    SubscribeToMessages: (call) => {
        const { userId } = call.request;
        subscribers.set(userId, call);

        call.on('cancelled', () => {
            subscribers.delete(userId);
        });
    }
};

// Start gRPC server
async function startServer() {
    let retryCount = 0;
    const maxRetries = 10;
    const retryDelay = 5000; // 5 secondes

    // Tentative de connexion à Kafka avec retry
    while (retryCount < maxRetries) {
        try {
            console.log(`Attempting to connect to Kafka (attempt ${retryCount + 1}/${maxRetries})...`);
            await producer.connect();
            console.log('Successfully connected to Kafka');
            break;
        } catch (error) {
            retryCount++;
            console.error(`Failed to connect to Kafka: ${error.message}`);

            if (retryCount >= maxRetries) {
                console.error('Max retries reached. Starting server without Kafka connection.');
                break;
            }

            console.log(`Retrying in ${retryDelay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }

    const server = new grpc.Server();
    server.addService(chat.ChatService.service, chatService);

    const PORT = process.env.CHAT_SERVICE_PORT || 50051;
    server.bindAsync(
        `0.0.0.0:${PORT}`,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
            if (error) {
                console.error('Failed to start gRPC server:', error);
                return;
            }
            server.start();
            console.log(`gRPC Chat service running on port ${port}`);
        }
    );

    // Start HTTP server for metrics
    const httpPort = process.env.CHAT_METRICS_PORT || 8080;
    const app = express();

    app.get('/metrics', async (req, res) => {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
    });

    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    app.listen(httpPort, '0.0.0.0', () => {
        console.log(`Metrics server running on port ${httpPort}`);
    });
}

startServer().catch(console.error);

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
