const {gql} = require('apollo-server');
const {prop} = require('ramda');
const Build = require('../model/Build');

const typeDef = gql`
    extend type Query {
        builds(project: String!): [Build]
    }

    "Jenkins Build"
    type Build implements IComponent {
        id: ID!
        project: String
        subsystem: String
        component: String
        environment: String
        action: String
        status: String
        buildUrl: String
        buildVersion: String
        buildStatus: String
        gitRemote: String
        commits: [Commit]
        tickets: [String]
    }
`;

const resolver = {
    Query: {
        builds: (parent, params, context) =>
            Build.getLatestBuilds(context, params),
    },
    Build: {
        buildUrl: prop('build_url'),
        buildStatus: prop('build_status'),
        tickets: prop('jiraTickets'),
        environment: prop('env'),
    },
};

module.exports = {
    typeDef,
    resolver,
};
