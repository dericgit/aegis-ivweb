const base = '/data/log/pm2';

module.exports = {
    apps: [{
        name: 'web',
        script: 'badjs-web/app.js',
        output: `${base}/web.log`,
        error: `${base}/web_error.log`,
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production'
        }
    }, {
        name: 'storage',
        script: 'aegis-storage/app.js',
        output: `${base}/storage.log`,
        error: `${base}/storage_error.log`,
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production'
        }
    }, {
        name: 'mq',
        script: 'aegis-mq/app.js',
        output: `${base}/mq.log`,
        error: `${base}/mq_error.log`,
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production'
        }
    }, {
        name: 'acceptor',
        script: 'aegis-acceptor/app.js',
        output: `${base}/acceptor.log`,
        error: `${base}/acceptor_error.log`,
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production'
        }
    }]
};
