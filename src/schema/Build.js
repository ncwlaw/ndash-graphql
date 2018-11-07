const { gql } = require('apollo-server');
const { prop } = require('ramda');
const { getBuilds } = require('../resolver/build');

// This "Book" type can be used in other type declarations.
// namespace -> system
// [Pending] -> subsystem
// gitRepo -> component
// event -> actionType
// status -> status
// version -> version
// env -> env
// build_url -> buildUrl
// commits -> commits
// jiraTickets -> tickets
const typeDef = gql`
  extend type Query {
    builds: [Build]
  }

  "Jenkins Build"
  type Build implements IComponent {
    system: String
    subsystem: String
    component: String
    gitRepo: String
    event: String
    status: String
    version: String
    env: String
    buildUrl: String
    commits: [Commit]
    tickets: [String]
  }
`;

const resolver = {
  Query: {
    builds: (parent, _, context) => getBuilds(context)(),
  },
  Build: {
    system: prop('namespace'),
    component: prop('repo'),
    buildUrl: prop('build_url'),
    tickets: prop('jiraTickets'),
  }
};


module.exports = {
  typeDef,
  resolver,
};
