const { gql } = require('apollo-server');
const prop = require('ramda').prop;

const typeDef = gql`
  extend type Query {
    components: [Component]
  }

  "System Components"
  type Component {
    system: String
    subsystem: String
    component: String
  }
`;

const getBuilds = ({ elasticsearch }) => () => {
  return elasticsearch.getClient().search({
    index: 'ngcc-*',
    body: {
      query: { 
        bool: {
        }
      }
    }
  })
  .then(query => query.hits.hits)
  .then(docs => docs.map(doc => doc._source))
}

const resolver = {
  Query: {
    components: (parent, _, context) => getBuilds(context)(),
  },
  Component: {
    system: prop('namespace'),
    component: prop('repo'),
  },
};


module.exports = {
  typeDef,
  resolver,
};
