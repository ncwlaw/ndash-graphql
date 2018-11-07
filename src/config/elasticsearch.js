const elasticsearch = require('elasticsearch');

let client;

const getClient = () => {
  if (client === undefined) {
    client = new elasticsearch.Client({
      host: "10.120.43.120:9200",
    });

    // ping has a 3000ms timeout 
    client.ping({
      requestTimeout: 1000,
    },  function( error) {
      if (error) {
        console.trace('Elasticsearch cluster is down!');
      } else {
        console.log('Connected to elasticsearch');
      }
    });
  }
  return client;
}

module.exports = {
  getClient,
};
