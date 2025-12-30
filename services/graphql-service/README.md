# GraphQL Service

GraphQL API gateway for the social network microservices.

## Features

- GraphQL schema for posts and comments
- Integration with Posts service via REST API
- Apollo Server for GraphQL execution
- Query optimization and caching

## GraphQL Schema

```graphql
type Comment {
  text: String!
  userId: String!
  createdAt: String!
}

type Post {
  id: ID!
  content: String!
  userId: String!
  likes: Int!
  comments: [Comment!]!
  createdAt: String!
}

type Query {
  feed(userId: ID!): [Post!]!
  post(id: ID!): Post
}
```

## Environment Variables

See `.env.example` for required environment variables.

## Running Locally

```bash
npm install
npm start
```

## Docker

```bash
docker build -t graphql-service .
docker run -p 4000:4000 graphql-service
```

## GraphQL Playground

Access the GraphQL playground at `http://localhost:4000` when running locally.