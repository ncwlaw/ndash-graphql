const {gql} = require('apollo-server');

const typeDef = gql`
    "Git Commits related to Build"
    type Commit {
        author: String
        message: String
    }
`;

module.exports = {
    typeDef,
};
