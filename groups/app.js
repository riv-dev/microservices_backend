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
var GroupAssignment = require('./models/group_assignment.js');
Groups.connect(app.get('env'), function() {
	GroupAssignment.connect(app.get('env'));
});

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
	if(request.user) {
		Groups.find_by_id(request.params.group_id, function(err, results, fields) {
			if(err) {
				response.send(err);
			} else {
				response.json(results);
			}
		});
	}
});

// gets all groups for a item id
app.get('/:item_type/:item_id/groups', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		Groups.find_all_by_item_query(request.query, {item_id: request.params.item_id, item_type: request.params.item_type}, function(err, results, fields) {
			if(err) {
				response.send(err);
			} else {
				response.json(results);
			}
		});
	}
});

// returns a list of item id's for the group
app.get('/groups/:group_id/:item_type', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		Groups.find_all_by_item_query(request.query, {item_type: request.params.item_type}, function(err, results, fields) {
			if(err) {
				response.send(err);
			} else {
				response.json(results);
			}
		});
	}
});

// add a new group
app.post('/groups', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		request.checkBody('name', "can't be empty").notEmpty();

		request.getValidationResult().then(function(result) {
			if (!result.isEmpty()) {
				console.log(JSON.stringify(result.array()));
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				Groups.add(request.body, function(err, results, fields) {
					if(err) {
						response.status(400).json({status: "fail", message: "MySQL error", errors: err});
					} else {
						response.json({status: "success", message: "Group added!", group_id: results.insertId});
					}
				});
			}
		});
	}
});

// adds a new group assignment to a item type
app.post('/:item_type/:item_id/groups/:group_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		var service_url;
		var servName = request.params.item_type + '_service';
		switch(app.get('env')) {
			case 'development':
				service_url = api_urls.local_development[servName];
				break;
			case 'remote_development':
				service_url = api_urls.remote_development[servName];
				break;
			case 'production':
				service_url = api_urls.production[servName];
				break;
			default:
				throw new Error('Unknown execution environment: ' + app.get('env'));
		}

		httpRequest(service_url + "/" + request.params.item_type + "/" + request.params.item_id, function(error, httpResponse, body) {
			if(error) {
				//return without the user details
				console.log("Error: " + error);
				response.json(results);
			} else {
				//return with the user details
				if(!(Object.keys(body).length === 0)) {
					GroupAssignment.add(request.params.group_id, request.params.item_id, request.params.item_type, function(err, results, fields) {
						if(err) {
							console.log(err);
							response.status(400).json({status: "fail", message: "MySQL error", errors: err});
						} else {
							response.json({status: "success", message: "Group assignment added.", group_assignment_id: results.insertId});
						}
					});
				} else {
					response.status(400).json({status: "fail", message: "Can't add a new group assignment to a " + request.params.item_type, errors: []});
				}
			}
		});
	}
});

// edit a group
app.put('/groups/:group_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		request.checkBody('name', "can't be empty").optional().notEmpty();
		
		request.getValidationResult().then(function(result) {
			if (!result.isEmpty()) {
				console.log(JSON.stringify(result.array()));
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				Groups.update(request.params.group_id, request.body, function(err, results, fields) {
					if(err) {
						response.status(400).json({status: "fail", message: "MySQL error", errors: err});
					} else {
						response.json({status: "success", message: "Group updated!", group_id: request.params.group_id});
					}
				});
			}
		});
	}
});

// fully delete a group, this should delete all group assignments too for the group
app.delete('/groups/:group_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		Groups.delete(request.params.group_id, function(err, results, fields) {
			if(err) {
				console.log(err);
				response.status(400).json({status: "fail", message: "MySQL error", errors: err});
			} else {
				response.json({status: "success", message: "Group deleted.", group_id: request.params.group_id});
			}
		});
	}
});

// remove a group from a item type
app.delete('/:item_type/:item_id/groups/:group_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		GroupAssignment.delete(request.params.group_id, request.params.item_id, request.params.item_type, function(err, results, fields) {
			if(err) {
				console.log(err);
				response.status(400).json({status: "fail", message: "MySQL error", errors: err});
			} else {
				response.json({status: "success", message: "Group assignment deleted.", item_id: request.params.item_id});
			}
		});
	}
});

app.listen(app.get('port'), function() {
	console.log('Express started on http://localhost:'+
		app.get('port') + '; press Ctrl-C to terminate.');
});