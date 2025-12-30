# Kafka Consumers

Background workers that process Kafka messages for the social network.

## Consumers

### Notifications Consumer (`notifications.js`)

Processes notification events from Kafka and stores them in MongoDB.

**Topics consumed:**
- `notifications` - User interactions (likes, comments, messages)

**Supported notification types:**
- `LIKE` - Post likes
- `COMMENT` - Post comments
- `CHAT_MESSAGE` - Chat messages

### Stories Consumer (`stories.js`)

Processes story-related events from Kafka.

**Topics consumed:**
- `stories` - Story creation and management

## Environment Variables

See `.env.example` for required environment variables.

## Running Locally

```bash
# Install dependencies
npm install

# Run notifications consumer
npm run start:notifications

# Run stories consumer
npm run start:stories

# Run both consumers
npm run start:all
```

## Docker

```bash
# Build notifications consumer
docker build -f Dockerfile.notifications -t kafka-consumers-notifications .

# Build stories consumer
docker build -f Dockerfile.stories -t kafka-consumers-stories .

# Run containers
docker run kafka-consumers-notifications
docker run kafka-consumers-stories
```

## Monitoring

Consumers log processed messages to the console with formatted output for easy monitoring.