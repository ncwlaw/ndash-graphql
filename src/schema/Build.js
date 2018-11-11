const {gql} = require('apollo-server');
const {prop} = require('ramda');
const Build = require('../model/Build');

// This "Book" type can be used in other type declarations.
// namespace -> system
// [Pending] -> subsystem
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
        id: ID!
        system: String
        subsystem: String
        component: String
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
        builds: (parent, _, context) => Build.getLatestBuilds(context),
    },
    Build: {
        system: prop('namespace'),
        component: prop('gitRepo'),
        buildUrl: prop('build_url'),
        tickets: prop('jiraTickets'),
    },
};

module.exports = {
    typeDef,
    resolver,
};
