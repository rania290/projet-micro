const { Kafka, logLevel } = require('kafkajs');
const mongoose = require('mongoose');
require('dotenv').config();

// Enhanced logging
const logger = {
    info: (message, meta = {}) => console.log(`[${new Date().toISOString()}] INFO: ${message}`, JSON.stringify(meta)),
    error: (message, error = {}) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error.stack || error)
};

// MongoDB connection with better error handling
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/social-network', {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection error', error);
        process.exit(1);
    }
};

// Story Schema
const StorySchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, index: { expires: '24h' } },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        index: { expires: 0 } // TTL index
    }
});

const Story = mongoose.model('Story', StorySchema);

// Kafka configuration
const kafkaBrokers = (process.env.KAFKA_BROKERS || 'kafka:29092').split(',');
logger.info(`Initializing Kafka consumer with brokers: ${kafkaBrokers.join(', ')}`);

const kafka = new Kafka({
    clientId: 'story-consumer',
    brokers: kafkaBrokers,
    logLevel: logLevel.ERROR,
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
});

const consumer = kafka.consumer({
    groupId: 'story-group',
    sessionTimeout: 30000, // 30 seconds
    heartbeatInterval: 10000, // 10 seconds
    maxBytesPerPartition: 1048576, // 1MB
    retry: {
        initialRetryTime: 1000,
        retries: 5
    }
});

const producer = kafka.producer({
    allowAutoTopicCreation: false,
    transactionTimeout: 30000
});

// Graceful shutdown handler
const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    try {
        await Promise.all([
            consumer.disconnect(),
            producer.disconnect(),
            mongoose.connection.close()
        ]);
        logger.info('Successfully disconnected from Kafka and MongoDB');
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown', error);
        process.exit(1);
    }
};

// Handle different shutdown signals
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, () => shutdown(signal));
});

// Process messages
const processMessage = async (message) => {
    try {
        const data = JSON.parse(message.value.toString());
        logger.info('Processing message', { topic: message.topic, partition: message.partition, offset: message.offset });

        switch (data.type) {
            case 'STORY_CREATED':
                const story = new Story({
                    userId: data.userId,
                    content: data.content,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                });

                await story.save();
                logger.info('Story created successfully', {
                    storyId: story._id,
                    userId: data.userId,
                    contentLength: data.content.length
                });

                // Send notification using the shared producer
                await producer.send({
                    topic: 'notifications',
                    messages: [{
                        key: data.userId,
                        value: JSON.stringify({
                            type: 'STORY_CREATED',
                            userId: data.userId,
                            targetUserId: data.userId,
                            storyId: story._id,
                            content: data.content.substring(0, 100) + (data.content.length > 100 ? '...' : '')
                        })
                    }]
                });
                logger.info('Notification sent for new story', { storyId: story._id });
                break;

            case 'STORY_EXPIRED':
                const result = await Story.findByIdAndDelete(data.storyId);
                if (result) {
                    logger.info('Story expired and deleted', { storyId: data.storyId });
                } else {
                    logger.info('Story not found for deletion', { storyId: data.storyId });
                }
                break;

            default:
                logger.warn('Unknown message type', { type: data.type });
        }
    } catch (error) {
        logger.error('Error processing message', {
            error: error.message,
            stack: error.stack,
            message: message.value?.toString()
        });
        // Consider implementing dead-letter queue here
    }
};

// Main consumer function
const runConsumer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Connect to Kafka
        logger.info('Connecting to Kafka...');
        await Promise.all([
            consumer.connect(),
            producer.connect()
        ]);

        // Subscribe to topics
        await consumer.subscribe({
            topic: 'stories',
            fromBeginning: false // Only consume new messages
        });

        // Set up message handler
        await consumer.run({
            autoCommit: true,
            autoCommitInterval: 5000, // Commit every 5 seconds
            autoCommitThreshold: 100, // Or commit after 100 messages
            eachMessage: async ({ topic, partition, message }) => {
                await processMessage(message);
            }
        });

        logger.info('Consumer is running...');
    } catch (error) {
        logger.error('Fatal error in consumer', error);
        await shutdown('UNHANDLED_ERROR');
    }
};

// Start the consumer
runConsumer().catch(error => {
    logger.error('Failed to start consumer', error);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});