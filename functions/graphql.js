const { ApolloServer, gql } = require("apollo-server-express");
const express = require("express");
const serverless = require("serverless-http");
const connectDB = require("../db");
const { ObjectId } = require("mongodb");

const typeDefs = gql`
  type Grade {
    _id: ID!
    username: String!
    subject: String!
    grade: Float!
    weight: Float!
  }

  type Query {
    grades(username: String): [Grade]
    grade(id: ID!): Grade
  }

  type Mutation {
    createGrade(username: String!, subject: String!, grade: Float!, weight: Float!): Grade
    updateGrade(id: ID!, username: String, subject: String, grade: Float, weight: Float): Grade
    deleteGrade(id: ID!): Boolean
  }
`;

const resolvers = {
  Query: {
    grades: async (_, { username }) => {
      const collection = await connectDB();
      const filter = username ? { username } : {};
      return await collection.find(filter).toArray();
    },
    grade: async (_, { id }) => {
      const collection = await connectDB();
      return await collection.findOne({ _id: new ObjectId(id) });
    },
  },

  Mutation: {
    createGrade: async (_, { username, subject, grade, weight }) => {
      const collection = await connectDB();
      const result = await collection.insertOne({ username, subject, grade, weight });
      return { _id: result.insertedId, username, subject, grade, weight };
    },

    updateGrade: async (_, { id, ...fields }) => {
      const collection = await connectDB();
      await collection.updateOne({ _id: new ObjectId(id) }, { $set: fields });
      return { _id: id, ...fields };
    },

    deleteGrade: async (_, { id }) => {
      const collection = await connectDB();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    },
  },
};

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ event }) => ({ event }),
});

let handler;

async function startApolloServer() {
  await server.start();
  server.applyMiddleware({ app });
  handler = serverless(app); 
}

startApolloServer();

exports.handler = async (event, context) => {
  if (!handler) {
    await new Promise(resolve => setTimeout(resolve, 100)); //таймаут щоб сервер ініціалізувався
    return exports.handler(event, context);
  }
  return handler(event, context);
};