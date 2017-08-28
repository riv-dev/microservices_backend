var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var jwt = require('jsonwebtoken');
var express_jwt = require('express-jwt');
var credentials = require('./credentials');
var morgan = require('morgan'); //for logging HTTP requests
var expressValidator = require('express-validator');
var httpRequest = require('request');
var api_urls = require('./api-urls');
var moment = require('moment');

//Configuration
var port = {
	development: 8008,
	test: 7008,
	production: 5008
}

app.set('port',process.env.PORT || port[app.get('env')]);
app.set('jwt_secret', credentials.authentication.secret);

//Middleware for parsing POST bodies
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(expressValidator()); // Used for post and put data validation

app.use(morgan('dev'));

console.log("Environment: " + app.get('env'));

//////////////////////
// Helper Functions //
//////////////////////
function extend(obj, src) {
	for (var key in src) {
		if (src.hasOwnProperty(key)) obj[key] = src[key];
	}
	return obj;
}

////////////////
/// Database ///
////////////////
var Groups = require('./models/groups.js');
Groups.connect(app.get('env'));

var GroupAssignment = require('./models/group_assignment.js');
GroupAssignment.connect(app.get('env'));

//////////////
/// Routes ///
//////////////

//Allow Cross-Domain Requests
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

function getTokenFromHeader(request) {
	var token = request.body.token || request.query.token || request.headers['x-access-token'];	
	return token;
}

app.get('/', function(request, response) {
	response.send("Welcome to the Groups API.  Updated the code!  Updated again!");
});

// gets all groups
app.get('/groups', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	Groups.find_all(request.query, function(err, results, fields) {
		if(err) {
			response.send(err);
		} else {
			response.json(results);
		}
	});
});

// gets a single group
app.get('/groups/:group_id', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	
});

// gets all groups for a category id
app.get('/:category/:category_id/groups', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	
});

// returns a list of category id's for the group
app.get('/groups/:group_id/:category', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	
});

// add a new group
app.post('/groups', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {

});

// adds a new group assignment to a category
app.post('/:category/:category_id/groups/:group_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {

});

// edit a group
app.put('/groups/:group_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	
});

// fully delete a group, this should delete all group assignments too for the group
app.delete('/groups/:group_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	
});

// remove a group from a category
app.delete('/:category/:category_id/groups/:group_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {

});

app.listen(app.get('port'), function() {
	console.log('Express started on http://localhost:'+
		app.get('port') + '; press Ctrl-C to terminate.');
});