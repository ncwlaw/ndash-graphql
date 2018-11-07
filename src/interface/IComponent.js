const { gql } = require('apollo-server');

const typeDef = gql`
  interface IComponent {
    system: String
    subsystem: String
    component: String
  }
`;

const resolver = {
  IComponent: { __resolveType() {} },
};

module.exports = {
  typeDef,
  resolver,
};
