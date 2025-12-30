# Posts Service

REST API service for managing posts and stories in the social network.

## Features

- Create, read, update posts
- Like posts and add comments
- Create and manage stories (24-hour expiration)
- Kafka integration for notifications
- MongoDB for data persistence

## API Endpoints

### Posts

- `GET /posts` - Get all posts
- `POST /posts` - Create a new post
- `GET /posts/:id` - Get a specific post
- `POST /posts/:id/like` - Like a post
- `POST /posts/:id/comments` - Add a comment to a post
- `GET /posts/:id/comments` - Get comments for a post

### Stories

- `GET /stories` - Get all active stories
- `POST /stories` - Create a new story
- `GET /stories/user/:userId` - Get stories by user

## Environment Variables

See `.env.example` for required environment variables.

## Running Locally

```bash
npm install
npm start
```

## Docker

```bash
docker build -t posts-service .
docker run -p 3020:3020 posts-service
```