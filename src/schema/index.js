const { gql } = require('apollo-server');
/*
 * Invidividual Schemas & Resolvers
 */
const { typeDef: Commit,  } = require('./Commit');
const { typeDef: Ticket } = require('./Ticket');
const {
  typeDef: Build,
  resolver: BuildResolver
} = require('./Build');
const {
  typeDef: Component,
  resolver: ComponentResolver
} = require('./Component');

/* Base Schema required by default */
const Query = gql`
  type Query {
    _empty: String
  }
`;

module.exports = {
  typeDefs: [
    Commit,
    Ticket,
    Build,
    Component,
    Query,
  ],
  resolvers: [
    BuildResolver,
    ComponentResolver,
  ],
}
