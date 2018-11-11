module.exports = {
    builds: [
        {
            namespace: 'NGCC',
            subsystem: 'Cosmos',
            gitRepo: 'NGCC',
            build_url: 'http://google.com',
            jiraTickets: ['NGC-8072'],
            event: 'Build',
            status: 'success',
            version: '1.0.10',
            env: 'Pre-Merge',
            commits: [
                {
                    author: 'Nathan',
                    message: 'Initial Commit',
                },
                {
                    author: 'Nathan',
                    message: 'Second Commit',
                },
                {
                    author: 'Nathan',
                    message: 'Third Commit',
                },
            ],
        },
        {
            namespace: 'NGCC',
            subsystem: 'Cosmos',
            gitRepo: 'NGCC',
            build_url: 'http://google.com',
            jiraTickets: ['NGC-8072'],
            event: 'Certify',
            status: 'success',
            version: '1.0.10',
            env: 'Pre-Merge',
            commits: [
                {
                    author: 'Nathan',
                    message: 'Initial Commit',
                },
                {
                    author: 'Nathan',
                    message: 'Second Commit',
                },
                {
                    author: 'Nathan',
                    message: 'Third Commit',
                },
            ],
        },
    ],
};
