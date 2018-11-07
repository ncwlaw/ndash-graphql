/*
 * Invidividual Schemas & Resolvers
 */
const {
  typeDef: IComponent,
  resolver: IComponentResolver
} = require('./IComponent');

module.exports = {
  typeDefs: [
    IComponent,
  ],
  resolvers: [
    IComponentResolver,
  ],
}
