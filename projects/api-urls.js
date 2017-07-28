module.exports = {
    development: {
        users_service: 'https://ryukyu-social-dev.cleverword.com/users_service/api',
        user_photos_service: 'https://ryukyu-social-dev.cleverword.com/user_photos_service/api',
        projects_service: 'https://ryukyu-social-dev.cleverword.com/projects_service/api',
        tasks_service: 'https://ryukyu-social-dev.cleverword.com/tasks_service/api'
    },

    local_development: {
        users_service: 'http://ryukyu-users-service:8000',
        user_photos_service: 'http://ryukyu-user-photos-service:8001',
        projects_service: 'http://ryukyu-projects-service:8002',
        tasks_service: 'http://ryukyu-tasks-service:8003'
    },

    //Same as development
    remote_development: {
        users_service: 'https://ryukyu-social-dev.cleverword.com/users_service/api',
        user_photos_service: 'https://ryukyu-social-dev.cleverword.com/user_photos_service/api',
        projects_service: 'https://ryukyu-social-dev.cleverword.com/projects_service/api',
        tasks_service: 'https://ryukyu-social-dev.cleverword.com/tasks_service/api'
    },

    production: {
        users_service: 'https://ryukyu-social.cleverword.com/users_service/api',
        user_photos_service: 'https://ryukyu-social.cleverword.com/user_photos_service/api',
        projects_service: 'https://ryukyu-social.cleverword.com/projects_service/api',
        tasks_service: 'https://ryukyu-social.cleverword.com/tasks_service/api'       
    }
}