const {gql} = require('apollo-server');
// Type definitions define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
const typeDef = gql`
    "Jira Tickets"
    type Ticket {
        author: String
        message: String
    }
`;

module.exports = {
    typeDef,
};
