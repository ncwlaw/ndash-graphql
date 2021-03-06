const {gql} = require('apollo-server');
const {prop} = require('ramda');
const Build = require('../model/Build');

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
        projects: [Project]
    }

    "Jenkins Build"
    type Project {
        id: ID!
        project: String
    }
`;

const resolver = {
    Query: {
        projects: (parent, _, context) => Build.getProjects(context),
    },
};

module.exports = {
    typeDef,
    resolver,
};
