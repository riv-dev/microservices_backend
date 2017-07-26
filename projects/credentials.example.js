//Create a copy of this file and name it credentials.js
//Replace username and password with your own in credentials.js
//credentials.js should not be uploaded onto Github
module.exports = {
    mysql: {
        production: {
            host: 'localhost',
            username: 'root',
            password: 'password'
        },
        development: {
            host: 'db-projects',
            username: 'root',
            password: 'password'
        },
        test: {
            host: 'db-projects',
            username: 'root',
            password: 'password'
        }
    },
    authentication: {
        secret: 'secret',
        development_token: ""
    }
}