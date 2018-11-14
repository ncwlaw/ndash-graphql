const {gql} = require('apollo-server');
const prop = require('ramda').prop;
const Build = require('../model/Build');

const typeDef = gql`
    extend type Query {
        subsystems: [Subsystem]
    }

    "Subsystem Components"
    type Subsystem {
        id: ID!
        project: String
        subsystem: String
    }
`;

const resolver = {
    Query: {
        subsystems: (parent, _, context) => Build.getSubsystems(context),
    },
};

module.exports = {
    typeDef,
    resolver,
};
