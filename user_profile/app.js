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

//Configuration
app.set('port',process.env.PORT || 5001);
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
UserProfile.connect();

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
	response.send("Welcome to the User Photos API");
});

app.get('/users/:id/profile', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	result = UserProfile.find_by_user_id(request.params.id, function(err,rows,fields) {
		if(err) {
			response.send(err);
		} else {
			if(rows && rows.length > 0) {
				response.json({id: rows[0].id, user_id: rows[0].user_id, nickname: rows[0].nickname, bio: rows[0].bio, birthday: rows[0].birthday});
			} else {
				response.sendStatus(404);
			}
		}
	});
});


app.post('/users/:id/profile', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response, next) {
	if(request.user.admin || request.user.id == request.params.id) {
		console.log("Valid user");
		request.getValidationResult().then(function(result) {
			if (!result.isEmpty()) {
				console.log(JSON.stringify(result.array()));
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
                UserProfile.add({user_id: request.body.user_id,
                    nickname: request.body.nickname,
                    bio: request.body.bio,
                    birthday: request.body.birthday}, function(err, rows, fields) {
                });
				// UserProfile.find_by_user_id(request.params.id, function(err, rows, fields) {
				// 	//Delete the entry in the database
				// 	UserProfile.delete(request.params.id, function(err, rows, fields) {
				// 		//Add new entry in the database
				//
				// 	});
				// });
				response.send("Yahoo!");
			}
		});	
	} else {
		response.sendStatus(401);
	}

});

app.put('/users/:id/profile', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response, next) {
	if(request.user.admin || request.user.id == request.params.id) {
		requestBody = {}
		request.getValidationResult().then(function(result) {
			if (!result.isEmpty()) {
				console.log(result.array());
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				if(request.body.nickname) {
					requestBody.nickname = request.body.nickname;
				}

				if(request.body.bio) {
					requestBody.bio = request.body.bio;
				}

				if(request.body.birthday) {
					requestBody.birthday = request.body.birthday;
				}

				UserProfile.update(request.params.id, requestBody, function(err, rows, fields) {
					if(err) {
						console.log(err);
						response.status(400).json({status: "fail", message: "MySQL error", errors: err});
					} else {
						response.json({status: "success", message: "User Profile Updated!"});
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