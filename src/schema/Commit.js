const {gql} = require('apollo-server');

const typeDef = gql`
    "Git Commits related to Build"
    type Commit {
        id: String
        author: String
        message: String
        timestamp: String
    }
`;

module.exports = {
    typeDef,
};
