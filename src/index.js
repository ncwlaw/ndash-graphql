const {ApolloServer} = require('apollo-server');
const ElasticSearchConnector = require('./connector/elasticsearch');
const settings = require('./config/settings');
const {typeDefs, resolvers} = require('./schema/index');
const {
    typeDefs: interfaceTypeDefs,
    resolvers: interfaceResolvers,
} = require('./interface/index');

// In the most basic sense, the ApolloServer can be started
// by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
const server = new ApolloServer({
    typeDefs: [...interfaceTypeDefs, ...typeDefs],
    resolvers: [...interfaceResolvers, ...resolvers],
    context: async ({req, headers}) => {
        const elasticsearch = await ElasticSearchConnector.create();
        return {
            elasticsearch,
        };
    },
});

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
server.listen().then(({url}) => {
    console.log(`🚀  Server ready at ${url}`);
});
