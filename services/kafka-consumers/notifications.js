const { Kafka, logLevel } = require('kafkajs');
const mongoose = require('mongoose');
require('dotenv').config();

// Enhanced logging
const logger = {
    info: (message, meta = {}) => console.log(`[${new Date().toISOString()}] INFO: ${message}`, JSON.stringify(meta)),
    error: (message, error = {}) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error.stack || error),
    warn: (message, meta = {}) => console.warn(`[${new Date().toISOString()}] WARN: ${message}`, JSON.stringify(meta))
};

// MongoDB connection with better error handling
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/social-network', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection error', error);
        process.exit(1);
    }
};

// Notification Schema with indexes
const NotificationSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true,
        enum: ['LIKE', 'COMMENT', 'CHAT_MESSAGE', 'STORY_CREATED'],
        index: true 
    },
    userId: { 
        type: String, 
        required: true,
        index: true 
    },
    targetUserId: { 
        type: String, 
        required: true,
        index: true 
    },
    postId: { 
        type: String,
        index: true 
    },
    commentText: String,
    messageId: { 
        type: String,
        index: true 
    },
    read: { 
        type: Boolean, 
        default: false,
        index: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        index: { expires: '30d' } // Auto-delete after 30 days
    }
});

// Add text index for search
NotificationSchema.index({
    content: 'text',
    commentText: 'text'
});

const Notification = mongoose.model('Notification', NotificationSchema);

// Kafka configuration
const kafkaBrokers = (process.env.KAFKA_BROKERS || 'kafka:29092').split(',');
logger.info(`Initializing Kafka consumer with brokers: ${kafkaBrokers.join(', ')}`);

const kafka = new Kafka({
    clientId: 'notification-consumer',
    brokers: kafkaBrokers,
    logLevel: logLevel.ERROR,
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
});

const consumer = kafka.consumer({ 
    groupId: 'notification-group',
    sessionTimeout: 30000, // 30 seconds
    heartbeatInterval: 10000, // 10 seconds
    maxBytesPerPartition: 1048576, // 1MB
    retry: {
        initialRetryTime: 1000,
        retries: 5
    }
});

// Graceful shutdown handler
const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    try {
        await Promise.all([
            consumer.disconnect(),
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

// Process notification message
const processNotification = async (message) => {
    try {
        const data = JSON.parse(message.value.toString());
        logger.info('Processing notification', { 
            type: data.type,
            userId: data.userId,
            targetUserId: data.targetUserId
        });

        // Validate required fields
        if (!data.type || !data.userId || !data.targetUserId) {
            throw new Error('Missing required fields in notification');
        }

        // Create notification in MongoDB
        const notification = new Notification({
            type: data.type,
            userId: data.userId,
            targetUserId: data.targetUserId,
            postId: data.postId,
            commentText: data.commentText,
            messageId: data.messageId,
            content: data.content // For STORY_CREATED
        });
        
        await notification.save();
        
        // Format notification message based on type
        let notificationMessage = '';
        switch (data.type) {
            case 'LIKE':
                notificationMessage = `User ${data.userId} liked your post`;
                break;
            case 'COMMENT':
                notificationMessage = `User ${data.userId} commented: "${data.commentText}"`;
                break;
            case 'CHAT_MESSAGE':
                notificationMessage = `New message from user ${data.userId}`;
                break;
            case 'STORY_CREATED':
                notificationMessage = `User ${data.userId} posted a new story`;
                break;
            default:
                notificationMessage = `New ${data.type} notification from user ${data.userId}`;
        }

        logger.info('Notification processed', {
            notificationId: notification._id,
            type: data.type,
            targetUserId: data.targetUserId
        });

        // Output formatted notification
        console.log('\n✨ New Notification ✨');
        console.log(notificationMessage);
        console.log('Time:', new Date().toLocaleString());
        console.log('-'.repeat(50));

    } catch (error) {
        logger.error('Error processing notification', {
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
        await consumer.connect();
        
        // Subscribe to topics
        await consumer.subscribe({ 
            topic: 'notifications',
            fromBeginning: false // Only consume new messages
        });

        // Set up message handler
        await consumer.run({
            autoCommit: true,
            autoCommitInterval: 5000, // Commit every 5 seconds
            autoCommitThreshold: 100, // Or commit after 100 messages
            eachMessage: async ({ topic, partition, message }) => {
                await processNotification(message);
            }
        });

        logger.info('Notification consumer is running...');
    } catch (error) {
        logger.error('Fatal error in notification consumer', error);
        await shutdown('UNHANDLED_ERROR');
    }
};

// Start the consumer
runConsumer().catch(error => {
    logger.error('Failed to start notification consumer', error);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception in notification consumer', error);
    shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection in notification consumer at:', promise, 'reason:', reason);
});