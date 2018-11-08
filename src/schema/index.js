const { gql } = require('apollo-server');
/*
 * Invidividual Schemas & Resolvers
 */
const { typeDef: Commit,  } = require('./Commit');
const { typeDef: Ticket } = require('./Ticket');
const { typeDef: Project, resolver: ProjectResolver } = require('./Project');
const { typeDef: Build, resolver: BuildResolver } = require('./Build');
const { typeDef: Component, resolver: ComponentResolver } = require('./Component');
const { typeDef: Subsystem, resolver: SubsystemResolver } = require('./Subsystem');

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
    Project,
    Subsystem,
    Query,
  ],
  resolvers: [
    BuildResolver,
    ComponentResolver,
    ProjectResolver,
    SubsystemResolver,
  ],
}
