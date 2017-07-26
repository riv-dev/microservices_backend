//Create a copy of this file and name it credentials.js
//Replace username and password with your own in credentials.js
//credentials.js should not be uploaded onto Github
//This a private file, do not uploaded onto Github
module.exports = {
    mysql: {
        production: { //no docker in production at the moment
            host: 'localhost',
            username: 'root',
            password: 'password'
        },
        development: {
            host: 'db-users',
            username: 'root',
            password: 'password'
        },
        test: {
            host: 'db-users',
            username: 'root',
            password: 'password'
        }
    },
    authentication: {
        secret: 'secret',
        development_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibGFzdG5hbWUiOiJBZG1pbiIsImZpcnN0bmFtZSI6IlJvb3QiLCJ0aXRsZSI6IkRlZmF1bHQgVXNlciIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwiaGFzaGVkX3Bhc3N3b3JkIjpudWxsLCJhZG1pbiI6MSwiaWF0IjoxNDk2MjI3ODA4fQ.zurJRBxIpSWG_U1pMWl64SyXfOA1Zw_EIwj70AT3rdM"
    }
}