const {gql} = require('apollo-server');
const prop = require('ramda').prop;
const Build = require('../model/Build');

const typeDef = gql`
    extend type Query {
        components: [Component]
    }

    "System Components"
    type Component {
        id: ID!
        system: String
        subsystem: String
        component: String
    }
`;

const resolver = {
    Query: {
        components: (parent, _, context) => Build.getComponents(context),
    },
    Component: {
        system: prop('namespace'),
        component: prop('gitRepo'),
    },
};

module.exports = {
    typeDef,
    resolver,
};
