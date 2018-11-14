const {gql} = require('apollo-server');
const prop = require('ramda').prop;
const Build = require('../model/Build');

const typeDef = gql`
    extend type Query {
        components: [Component]
    }

    "System Components"
    type Component implements IComponent {
        id: ID!
        project: String
        subsystem: String
        component: String
    }
`;

const resolver = {
    Query: {
        components: (parent, _, context) => Build.getComponents(context),
    },
};

module.exports = {
    typeDef,
    resolver,
};
