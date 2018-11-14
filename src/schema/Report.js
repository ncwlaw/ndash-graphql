const {gql} = require('apollo-server');
const {prop, identity} = require('ramda');
const Build = require('../model/Build');

const typeDef = gql`
    extend type Query {
        weeklyProjectReport(project: String!, action: String!): ReportSummary

        weeklySubsystemReport(
            project: String!
            subsystem: String!
            action: String!
        ): ReportSummary

        weeklyComponentReport(
            project: String!
            subsystem: String!
            component: String!
            action: String!
        ): ReportSummary

        subsystemReport(
            project: String!
            subsystem: String!
            action: String!
        ): ReportSummary
    }

    type ReportSummary {
        reports: [Report]
        total_pass: Int
        total_fail: Int
        total_pass_and_fail: Int
    }

    type Report {
        environment: String
        pass: [PassResult]
        fail: [FailResult]
        total: [TotalResult]
    }

    type PassResult {
        id: ID!
        key: ID!
        count: Int
    }

    type FailResult {
        id: ID!
        key: ID!
        count: Int
    }

    type TotalResult {
        id: ID!
        key: ID!
        count: Int
    }
`;

const resolver = {
    Query: {
        weeklyProjectReport: (parent, params, context) =>
            Build.getWeeklyReportsByProject(context, params),
        weeklySubsystemReport: (parent, params, context) =>
            Build.getWeeklyReportsBySubsystem(context, params),
        weeklyComponentReport: (parent, params, context) =>
            Build.getWeeklyReportsByComponent(context, params),
        subsystemReport: (parent, params, context) =>
            Build.getReportsBySubsystem(context, params),
    },
};

module.exports = {
    typeDef,
    resolver,
};
