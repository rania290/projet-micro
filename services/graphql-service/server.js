const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const { default: axios } = require('axios');
const promClient = require('prom-client');
require('dotenv').config();

// Créer un registre de métriques
const register = new promClient.Registry();

// Métriques par défaut
promClient.collectDefaultMetrics({ register });

const POSTS_SERVICE_URL = process.env.POSTS_SERVICE_URL || 'http://localhost:3020';

// GraphQL Schema
const typeDefs = gql`
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
`;

// Resolvers
const resolvers = {
  Query: {
    feed: async (_, { userId }) => {
      try {
        console.log('Fetching posts from:', `${POSTS_SERVICE_URL}/posts`);
        const response = await axios.get(`${POSTS_SERVICE_URL}/posts`);
        console.log('Posts received:', response.data);
        const posts = response.data;

        if (!Array.isArray(posts)) {
          console.error('Received invalid posts data:', posts);
          throw new Error('Invalid posts data received');
        }

        return posts.map(post => ({
          id: post._id,
          content: post.content,
          userId: post.userId,
          likes: post.likes || 0,
          comments: post.comments || [],
          createdAt: post.createdAt
        }));
      } catch (error) {
        console.error('Error fetching feed:', error.message, error.response?.data);
        throw new Error(`Failed to fetch feed: ${error.message}`);
      }
    },
    post: async (_, { id }) => {
      try {
        console.log('Fetching post:', `${POSTS_SERVICE_URL}/posts/${id}`);
        const response = await axios.get(`${POSTS_SERVICE_URL}/posts/${id}`);
        console.log('Post received:', response.data);
        const post = response.data;

        if (!post) {
          throw new Error(`Post not found with id: ${id}`);
        }

        return {
          id: post._id,
          content: post.content,
          userId: post.userId,
          likes: post.likes || 0,
          comments: post.comments || [],
          createdAt: post.createdAt
        };
      } catch (error) {
        console.error('Error fetching post:', error.message, error.response?.data);
        throw new Error(`Failed to fetch post: ${error.message}`);
      }
    }
  }
};

// Create Express app
const app = express();

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Here you would typically handle authentication
    return { userId: req.headers.userid };
  }
});

// Start the server
const PORT = process.env.GRAPHQL_SERVICE_PORT || 4000;

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  // Prometheus metrics endpoint
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (ex) {
      res.status(500).end(ex);
    }
  });

  // No changes needed here as we moved metrics endpoint above for better express handling
  app.listen(PORT, () => {
    console.log(`GraphQL service running at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`Metrics available at http://localhost:${PORT}/metrics`);
  });
}

startServer();
