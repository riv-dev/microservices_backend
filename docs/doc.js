const Docs = require('express-api-doc');
const app = require('../user_management/app'); // your app.js
const docs = new Docs(app);
docs.generate({
  path:     './users_service.html',
});