/*
 * This file contains the interface for the Build Model
 */

const R = require('ramda');
const {builds} = require('./constants');

/**
 * Wrapper for queries
 * Must pass in context followed my remaining params
 *
 * @returns {undefined}
 */
const query = R.curry((f, ...args) => {
    const [context, params] = args;
    return f(context, params);
});

/**
 * Default Query fields must be applied to all queries
 *
 * @returns {undefined}
 */
const buildQuery = q => {
    return {
        index: 'ngcc-*',
        ...q,
    };
};

/**
 * Fetch all projects
 *
 * @returns [Project]
 */
const aggregateProjects = async context => {
    const getQuery = () =>
        buildQuery(q, {
            body: {
                size: 0,
                aggregations: {
                    byProjects: {
                        terms: {
                            field: 'namespace.keyword',
                        },
                    },
                },
            },
        });

    const response = await context.elasticsearch.search(getQuery());

    return R.map(
        R.compose(
            namespace => ({namespace}),
            R.prop('key'),
            R.path(['aggregations', 'byProjects', 'buckets']),
        ),
    )(response);
};

/**
 * Fetch all components
 *
 * @returns [Component]
 */
const aggregateComponents = async (context, {projects}) => {
    const format = R.compose(
        R.map(R.prop('_source')),
        R.path([
            'aggregations',
            'by_components',
            'buckets',
            '0',
            'by_component_hits',
            'hits',
            'hits',
        ]),
    )(response);

    const getQuery = () =>
        buildQuery({
            body: {
                size: 0,
                query: {
                    terms: {
                        namespace: projects,
                    },
                },
                aggregations: {
                    by_components: {
                        terms: {
                            field: 'gitRepo.keyword',
                        },
                        aggregations: {
                            by_component_hits: {
                                top_hits: {
                                    size: 1,
                                    _source: {
                                        includes: ['gitRepo', 'namespace'],
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

    const response = await context.elasticsearch.search(getQuery());
    return format(response);
};

/**
 * Fetch all latest builds for all projects
 *
 * @returns [Build]
 */
const latestBuilds = async context => {
    const format = (() => {
        const bucketLens = R.lensProp('buckets');
        const projectLens = R.compose(
            R.lensProp('by_namespace'),
            bucketLens,
        );
        const componentLens = R.compose(
            R.lensProp('by_component'),
            bucketLens,
        );
        const environmentLens = R.compose(
            R.lensProp('by_env'),
            bucketLens,
        );
        const buildLens = R.lensPath(['by_builds', 'hits', 'hits']);
        return R.compose(
            R.map(source => ({
                ...source,
                version: '1.0.10',
                subsystem: 'Cosmos',
            })),
            R.map(({_id: id, _source: source}) => ({...source, id})),
            R.reduce(R.concat, []),
            R.map(R.view(buildLens)),
            R.reduce(R.concat, []),
            R.map(R.view(environmentLens)),
            R.reduce(R.concat, []),
            R.map(R.view(componentLens)),
            R.view(projectLens),
            R.prop('aggregations'),
        );
    })();

    const getQuery = (() => {
        const fields = [
            'gitRepo',
            'namespace',
            'env',
            'event',
            'build_url',
            'eventType',
            'actionType',
            'commits',
            'jiraTickets',
            'build_id',
        ];

        const by_namespace = {
            terms: {
                field: 'namespace.keyword',
            },
        };
        const by_component = {
            terms: {
                field: 'gitRepo.keyword',
            },
        };
        const by_env = {
            terms: {
                field: 'env.keyword',
            },
            aggs: {
                by_builds: {
                    top_hits: {
                        size: 1,
                        _source: {
                            includes: fields,
                        },
                        sort: [
                            {
                                '@timestamp': {
                                    order: 'desc',
                                },
                            },
                        ],
                    },
                },
            },
        };

        return () =>
            buildQuery({
                body: {
                    size: 0,
                    aggs: {
                        by_namespace: {
                            ...by_namespace,
                            aggs: {
                                by_component: {
                                    ...by_component,
                                    aggs: {
                                        by_env: {
                                            ...by_env,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
    })();

    const response = await context.elasticsearch.search(getQuery());
    return format(response);
};

class Build {
    /**
     * Fetches all projects
     *
     * @returns [Project]
     */
    async getProjects(context) {
        const builds = await query(latestBuilds, context);
        return R.compose(
            R.uniq,
            R.map(R.pick(['namespace'])),
        )(builds);
    }

    /**
     * Fetches all components
     *
     * @returns [Components]
     */
    async getComponents(context) {
        const builds = await query(latestBuilds, context);
        return R.compose(
            R.uniq,
            R.map(R.pick(['namespace', 'subsystem', 'gitRepo'])),
        )(builds);
    }

    /**
     * Fetches all subsystems
     *
     * @returns [Subsystem]
     */
    async getSubsystems(context) {
        const builds = await query(latestBuilds, context);
        return R.compose(
            R.uniq,
            R.map(R.pick(['namespace', 'subsystem'])),
        )(builds);
    }

    /**
     * Fetches latest builds for every build environment
     *
     * @returns [Build]
     */
    async getLatestBuilds(context) {
        return await query(latestBuilds, context);
    }
}

module.exports = new Build();
