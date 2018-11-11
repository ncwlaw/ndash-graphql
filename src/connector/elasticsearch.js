/*
 * Singleton Factory for ElasticSearchConnector
 */
const elasticsearch = require('elasticsearch');

let connector;

class ElasticSearchConnector {
    static async create() {
        if (connector === undefined) {
            const o = new ElasticSearchConnector();
            connector = await o.initialize();
        }
        return connector;
    }

    constructor(connection) {
        this.connection = connection;
    }

    async initialize() {
        let result = undefined;

        this.connection = await new elasticsearch.Client({
            host: ENVIRONMENT.ELASTICSEARCH_HOST,
        });

        // Verify Connection
        // ping has a 3000ms timeout
        const status = await this.ping({
            requestTimeout: 1000,
        });

        if (status) {
            result = this;
        }
        return result;
    }

    async search(params) {
        const result = this.connection.search(params);
        return result;
    }

    async get() {
        if (connector === undefined) {
            console.error(
                'Elasticsearch connector was not established, please create connector',
            );
        }
        return connector;
    }

    async ping(settings) {
        let result = true;
        try {
            const response = await this.connection.ping(settings);
            console.log('Connected to elasticsearch');
        } catch (error) {
            console.trace('Elasticsearch cluster is down!');
            result = false;
        }
        return result;
    }

    close() {
        if (this.connection) {
            this.connection.close();
        } else {
            console.error(
                'Elasticsearch connector was not established, please create connector',
            );
        }
    }
}

module.exports = ElasticSearchConnector;
