/*
 * This file contains the interface for the Build Model
 */

const formatDate = require('date-fns/format');
const subDays = require('date-fns/sub_days');
const R = require('ramda');
const {builds} = require('./constants');

/**
 * Wrapper for queries
 * Must pass in context followed my remaining params
 *
 * @returns {undefined}
 */
const call = R.curry((f, ...args) => {
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
                    by_projects: {
                        terms: {
                            field: 'project.keyword',
                        },
                    },
                },
            },
        });

    const response = await context.elasticsearch.search(getQuery());

    return R.map(
        R.compose(
            project => ({project}),
            R.prop('key'),
            R.path(['aggregations', 'by_projects', 'buckets']),
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
                        'project.keyword': projects,
                    },
                },
                aggregations: {
                    by_components: {
                        terms: {
                            field: 'component.keyword',
                        },
                        aggregations: {
                            by_component_hits: {
                                top_hits: {
                                    size: 1,
                                    _source: {
                                        includes: ['component', 'project'],
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
 * Fetch all weekly reports for all project status
 * project, subsystem, component, environment = ENUM
 *
 * @returns [Build]
 */
const weeklyReports = async (context, {filters}) => {
    const format = R.converge(
        (reports, totals) => ({
            reports,
            ...totals,
        }),
        [
            R.compose(
                R.map(({key, fail, pass, total}) => {
                    const getResults = R.compose(
                        R.map(({key_as_string, doc_count}) => ({
                            id: key_as_string,
                            count: doc_count,
                        })),
                        R.path(['reports', 'buckets']),
                    );
                    return {
                        environment: key,
                        pass: getResults(pass),
                        fail: getResults(fail),
                        total: getResults(total),
                    };
                }),
                R.path(['aggregations', 'reports', 'buckets']),
            ),
            R.compose(
                ({total_pass, total_fail, total_pass_and_fail}) => ({
                    total_pass: total_pass.value,
                    total_fail: total_fail.value,
                    total_pass_and_fail: total_pass_and_fail.value,
                }),
                R.prop('aggregations'),
            ),
        ],
    );

    const today = formatDate(new Date(), 'YYYY-MM-DD');
    const lastWeek = formatDate(subDays(new Date(), 7), 'YYYY-MM-DD');
    const getQuery = (() => {
        const aggregateByWeek = {
            reports: {
                date_histogram: {
                    field: '@timestamp',
                    interval: 'day',
                    order: {_key: 'asc'},
                    format: 'MM-dd || yyyy-MM-dd',
                    min_doc_count: 0,
                    extended_bounds: {
                        min: lastWeek,
                        max: today,
                    },
                },
            },
        };
        return () =>
            buildQuery({
                body: {
                    size: 0,
                    query: {
                        bool: {
                            must: filters,
                        },
                    },
                    aggs: {
                        reports: {
                            terms: {
                                field: 'env.keyword',
                            },
                            aggs: {
                                pass: {
                                    filter: {
                                        term: {
                                            'build_status.keyword': 'SUCCESS',
                                        },
                                    },
                                    aggs: {...aggregateByWeek},
                                },
                                fail: {
                                    filter: {
                                        term: {
                                            'build_status.keyword': 'FAILURE',
                                        },
                                    },
                                    aggs: {...aggregateByWeek},
                                },
                                total: {
                                    filter: {
                                        terms: {
                                            'build_status.keyword': [
                                                'SUCCESS',
                                                'FAILURE',
                                            ],
                                        },
                                    },
                                    aggs: {...aggregateByWeek},
                                },
                            },
                        },
                        total_pass: {
                            sum_bucket: {
                                buckets_path: 'reports>pass>_count',
                            },
                        },
                        total_fail: {
                            sum_bucket: {
                                buckets_path: 'reports>fail>_count',
                            },
                        },
                        total_pass_and_fail: {
                            sum_bucket: {
                                buckets_path: 'reports>total>_count',
                            },
                        },
                    },
                },
            });
    })();

    const response = await context.elasticsearch.search(getQuery());
    return format(response);
};

/**
 * Fetch all latest builds for all projects
 *
 * @returns [Build]
 */
const latestBuilds = async (context, params) => {
    const query = (params && params.query) || {};
    const format = (() => {
        const bucketLens = R.lensProp('buckets');
        const projectLens = R.compose(
            R.lensProp('by_project'),
            bucketLens,
        );
        const subsystemLens = R.compose(
            R.lensProp('by_subsystem'),
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
            R.map(({_id: id, _source: source}) => ({...source, id})),
            R.reduce(R.concat, []),
            R.map(R.view(buildLens)),
            R.reduce(R.concat, []),
            R.map(R.view(environmentLens)),
            R.reduce(R.concat, []),
            R.map(R.view(componentLens)),
            R.reduce(R.concat, []),
            R.map(R.view(subsystemLens)),
            R.view(projectLens),
            R.prop('aggregations'),
        );
    })();

    const getQuery = (() => {
        const fields = [
            'project',
            'subsystem',
            'component',
            'env',
            'buildVersion',
            'build_url',
            'build_id',
            'build_status',
            'action',
            'status',
            'commits',
            'jiraTickets',
            'gitRemote',
        ];

        const by_project = {
            terms: {
                field: 'project.keyword',
            },
        };
        const by_subsystem = {
            terms: {
                field: 'subsystem.keyword',
            },
        };
        const by_component = {
            terms: {
                field: 'component.keyword',
            },
        };
        const by_env = {
            terms: {
                field: 'env.keyword',
            },
        };
        const by_builds = {
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
        };

        return () =>
            buildQuery({
                body: {
                    size: 0,
                    ...query,
                    aggs: {
                        by_project: {
                            ...by_project,
                            aggs: {
                                by_subsystem: {
                                    ...by_subsystem,
                                    aggs: {
                                        by_component: {
                                            ...by_component,
                                            aggs: {
                                                by_env: {
                                                    ...by_env,
                                                    aggs: {
                                                        by_builds: {
                                                            ...by_builds,
                                                        },
                                                    },
                                                },
                                            },
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

const filterByTerm = (field, value) => ({
    term: {
        [field]: value,
    },
});

const filterByWeek = () => {
    const today = formatDate(new Date(), 'YYYY-MM-DDTHH:mm:ss');
    const lastWeek = formatDate(subDays(new Date(), 7), 'YYYY-MM-DDTHH:mm:ss');
    return {
        range: {
            '@timestamp': {
                from: lastWeek,
                to: today,
            },
        },
    };
};

const applyFilters = R.apply(R.map(([f, ...args]) => R.apply(f, args)));

class Build {
    /**
     * Fetches all projects
     *
     * @returns [Project]
     */
    async getProjects(context) {
        const builds = await call(latestBuilds, context);
        return R.compose(
            R.uniq,
            R.map(R.pick(['project'])),
        )(builds);
    }

    /**
     * Fetches all components
     *
     * @returns [Components]
     */
    async getComponents(context) {
        const builds = await call(latestBuilds, context);
        return R.compose(
            R.uniq,
            R.map(R.pick(['project', 'subsystem', 'component'])),
        )(builds);
    }

    /**
     * Fetches all subsystems
     *
     * @returns [Subsystem]
     */
    async getSubsystems(context) {
        const builds = await call(latestBuilds, context);
        return R.compose(
            R.uniq,
            R.map(R.pick(['project', 'subsystem'])),
        )(builds);
    }

    /**
     * Fetches latest builds for every build environment
     *
     * @returns [Build]
     */
    async getLatestBuilds(context, {project}) {
        const filters = applyFilters([
            filterByTerm,
            'project.keyword',
            project,
        ]);
        const query = {
            query: {
                bool: {
                    filter: filters,
                },
            },
        };
        return await call(latestBuilds, context, {query});
    }

    /**
     * getWeeklyReportsByProject
     *
     * Fetches aggregate of weekly successful | failed builds
     *
     * @param context
     * @param {}
     * @returns {undefined}
     */
    async getWeeklyReportsByProject(context, {project, action}) {
        const filters = applyFilters(
            [filterByTerm, 'project.keyword', project],
            [filterByTerm, 'action.keyword', action],
            [filterByWeek],
        );

        return await call(weeklyReports, context, {filters});
    }

    /**
     * getWeeklyReportsBySubsystem
     *
     * Fetches aggregate of weekly successful | failed builds
     *
     * @param context
     * @param {}
     * @returns {undefined}
     */
    async getWeeklyReportsBySubsystem(context, {project, subsystem, action}) {
        const filters = applyFilters(
            [filterByTerm, 'project.keyword', project],
            [filterByTerm, 'subsystem.keyword', subsystem],
            [filterByTerm, 'action.keyword', action],
            [filterByWeek],
        );

        return await call(weeklyReports, context, {filters});
    }

    /**
     * getWeeklyReportsByComponent
     *
     * Fetches aggregate of weekly successful,failed,total builds
     *
     * @param context
     * @param {}
     * @returns {undefined}
     */
    async getWeeklyReportsByComponent(
        context,
        {project, subsystem, component, action},
    ) {
        const filters = applyFilters(
            [filterByTerm, 'project.keyword', project],
            [filterByTerm, 'subsystem.keyword', subsystem],
            [filterByTerm, 'component.keyword', component],
            [filterByTerm, 'action.keyword', action],
            [filterByWeek],
        );

        return await call(weeklyReports, context, {filters});
    }

    /**
     * getReportsBySubsystem
     *
     * Fetches total successful,failed,total builds
     *
     *
     * @param context
     * @param {}
     * @returns {undefined}
     */
    async getReportsBySubsystem(context, {project, subsystem, action}) {
        const filters = applyFilters(
            [filterByTerm, 'project.keyword', project],
            [filterByTerm, 'subsystem.keyword', subsystem],
            [filterByTerm, 'action.keyword', action],
        );

        return await call(weeklyReports, context, {filters});
    }
}

module.exports = new Build();
