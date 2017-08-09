var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var jwt = require('jsonwebtoken');
var express_jwt = require('express-jwt');
var credentials = require('./credentials');
var morgan = require('morgan'); //for logging HTTP requests
var expressValidator = require('express-validator');
var multer  = require('multer');
var path = require('path');
var fs = require("fs");
var moment = require('moment');

//Configuration
port = {
	development: 8005,
	test: 7005,
	production: 5005
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

////////////////
/// Database ///
////////////////
var UserProfile = require('./models/UserProfile.js');
UserProfile.connect(app.get('env'));

//////////////
/// Routes ///
//////////////

//Allow Cross-Domain Requests
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

function getTokenFromHeader(request) {
			var token = request.query.token || request.headers['x-access-token'];	
			return token;
}

app.get('/', function(request, response) {
	response.send("Welcome to the User Profile API");
});

app.get('/users/:user_id/profile', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	result = UserProfile.find_by_user_id(request.params.user_id, function(err,rows,fields) {
		if(err) {
			response.send(err);
		} else {
			if(rows && rows.length > 0) {
				response.json(rows[0]);
			} else {
				response.sendStatus(404);
			}
		}
	});
});

//Behavior: Add if does not exist.  Return error if already exists.
app.post('/users/:user_id/profile', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response, next) {
	if(request.user.admin || request.user.id == request.params.id) {
		request.checkBody('birthday',"must be a valid date in ISO8601 format").optional().isISO8601();

		console.log("Valid user");
		request.getValidationResult().then(function(result) {
			if (!result.isEmpty()) {
				console.log(JSON.stringify(result.array()));
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				UserProfile.find_by_user_id(request.params.user_id, function(err, rows, fields) {
					if(rows && rows.length > 0) {
						response.status(400).json({status: "fail", message: "User profile already exists"});
					} else {
						request.body.user_id = request.params.user_id;

						if(request.body.birthday) {
							request.body.birthday = moment(request.body.birthday).format("YYYY-MM-DD");
						}

						UserProfile.add(request.body, function (err, rows, fields) {
							if (err) {
								console.log(err);
								response.status(500).json({ status: "fail", message: "System error." });
							} else {
								response.send({ status: "success", message: "User profile added!", user_id: request.params.user_id});
							}
						});
					}
				});
			}
		});	
	} else {
		response.sendStatus(401);
	}

});

app.put('/users/:user_id/profile', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response, next) {
	if(request.user.admin || request.user.id == request.params.id) {
		request.checkBody('birthday',"must be a valid date in ISO8601 format").optional().isISO8601();
		request.getValidationResult().then(function(result) {
			if (!result.isEmpty()) {
				console.log(result.array());
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				if(request.body.birthday) {
					request.body.birthday = moment(request.body.birthday).format("YYYY-MM-DD");
				}

				UserProfile.update(request.params.user_id, request.body, function(err, rows, fields) {
					if(err) {
						console.log(err);
						response.status(400).json({status: "fail", message: "MySQL error", errors: err});
					} else {
						response.json({status: "success", message: "User Profile Updated!", user_id: request.params.user_id});
					}
				});
			}
		});
	} else {
		response.sendStatus(401);
	}
});

app.delete('/users/:id/profile', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
		if(request.user.admin || request.user.id == request.params.id) {
			UserProfile.find_by_user_id(request.params.id, function(err, rows, fields) {
				//Delete the entry in the database
                UserProfile.delete(request.params.id, function(err, rows, fields) {
					response.send({status: "success", message: "User Profile Deleted!"});
				});	
			});
		} else {
			response.sendStatus(401);
		}
});

app.listen(app.get('port'), function() {
	console.log('Express started on http://localhost:'+
		app.get('port') + '; press Ctrl-C to terminate.');
});