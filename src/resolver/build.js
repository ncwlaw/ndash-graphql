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

module.exports = {
  getBuilds,
};
