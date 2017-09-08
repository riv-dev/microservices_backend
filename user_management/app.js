var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var jwt = require('jsonwebtoken');
var express_jwt = require('express-jwt');
var credentials = require('./credentials');
var morgan = require('morgan'); //for logging HTTP requests
var bcrypt = require('bcrypt-nodejs'); //for password hashing
var expressValidator = require('express-validator');
var seeder = require('./seeder.SM.js');

//Configuration
var port = {
	development: 8000,
	test: 7000,
	production: 5000
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
var Users = require('./models/users.js');
Users.connect(app.get("env"));



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

app.post('/users/authenticate', function(req, res) {
  //Find the user
  Users.find_by_email(req.body.email, function(err, results, fields) {
    if(err) {
		console.log(err);
		res.status(500).json({status: "fail", message: "System error."});
	}
	else if(results && results.length > 0) {
		var user = results[0];
		// Load hash from your password DB.
		bcrypt.compare(req.body.password, user.hashed_password, function(err, validated) {
			// res == true
			if(validated == true) {
				user.hashed_password = null;
				var token = jwt.sign(user, app.get('jwt_secret'), {expiresIn: '8h'});

				// return the information including token as JSON
				res.json({
					status: "success",
					message: 'Enjoy your token!',
					token: token
				});
			} else {
				res.status(401).json({ status: "fail", message: 'Authentication failed. Wrong password.' });
			}
		}); //End bcrypt
    } //End else if(user)
    else {
    	res.status(401).json({status: "fail", message: 'Authentication failed. User not found.' });
    } 

  }); //End User.find_by_email
});

app.get('/', function(request, response) {
	response.send("Welcome to the Users API. It's been updated! And again!!");
});

app.get('/users', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	if(request.query.ids) {
		Users.find_all_by_ids(request.query.ids, function(err,results,fields) {
			if(err) {
				console.log(err)
				response.status(500).json({status: "fail", message: "System error."});
			} else {
				response.json(results);
			}
		});		
	} else {
		Users.find_all(function(err,results,fields) {
			if(err) {
				console.log(err)
				response.status(500).json({status: "fail", message: "System error."});
			} else {
				response.json(results);
			}
		});
	}
});

app.get('/users/:id', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	result = Users.find_by_id(request.params.id, function(err,results,fields) {
		if(err) {
			console.log(err);
			response.status(500).json({status: "fail", message: "System error."});
		} else {
			response.json(results[0]);
		}
	});
});

app.post('/users', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
  	Users.find_by_email(request.body.email, function(err, results, fields) { //make sure email has not already been taken
		var emailUniqueError = null;

		if(err) {
			console.log(err);
			response.status(500).json({status: "fail", message: "System error."});
		}
		else if(results && results.length > 0) {
			emailUniqueError = {"param":"email", "msg":"Email is already used.  Please choose another one.", "user_id": results[0].id};
		} //End else if(user)

		if(request.user.admin) {
			request.checkBody('lastname', "can't be empty").notEmpty();
			request.checkBody('firstname',"can't be empty").notEmpty();
			request.checkBody('email', "can't be empty").notEmpty();
			request.checkBody('email', 'must be a valid email address').isEmail();

			if(request.body.admin && request.body.admin != null)
				request.checkBody('admin', 'must be boolean value').isBoolean();

			if(request.body.password && request.body.password.length > 0) {
				request.body.hashed_password = bcrypt.hashSync(request.body.password);
				delete request.body.password; //prep request.body to feed into User.update
			}

			request.getValidationResult().then(function(result) {
				if (emailUniqueError || !result.isEmpty()) {
					if(emailUniqueError) {result.array().push(emailUniqueError)};
					console.log(result.array());
					response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
					return;
				} else {
					Users.add(request.body, function(err, results, field) {
						if(err) {
							console.log(err);
							response.status(500).json({status: "fail", message: "System error."});
						} else {
							response.send({status: "success", message: "User added!", user_id: results.insertId});
						}
					});
				}
			});
		} else {
			response.sendStatus(401);
		}
  	});

});

app.put('/users/:id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Allow only the admin to edit the user information
	if(request.user.admin) {
		request.checkBody('lastname', "can't be empty").optional().notEmpty();
		request.checkBody('firstname',"can't be empty").optional().notEmpty();
		request.checkBody('email', "can't be empty").optional().notEmpty();
		request.checkBody('email', 'must be a valid email address').optional().isEmail();

		if(request.body.admin && request.body.admin != null)
			request.checkBody('admin', 'must be boolean value').optional().isBoolean();

		var hashed_password;
		if(request.body.password && request.body.password.length > 0) {
			request.body.hashed_password = bcrypt.hashSync(request.body.password);
			delete request.body.password; //prep request.body to feed into User.update
		}

		request.getValidationResult().then(function(result) {
			if (!result.isEmpty()) {
				console.log(result.array());
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				Users.update(request.params.id, request.body, function(err, results, fields) {
					if(err) {
						console.log(err);
						response.status(500).json({status: "fail", message: "MySQL error", errors: err});
					} else {
						response.json({status: "success", message: "User updated!"});
					}
				});
			}
		});			
	} else {
		response.sendStatus(401);
	}
});

//Allow both admin and owners of account to update password
app.put('/users/:id/password', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Allow only the admin to edit the user information
	if(request.user.admin || request.user.id == request.params.id) {
		var hashed_password;
		if(request.body.password && request.body.password.length > 0) {
			request.body.hashed_password = bcrypt.hashSync(request.body.password);
			delete request.body.password; //prep request.body to feed into User.update
		}

		request.getValidationResult().then(function(result) {
			if (!result.isEmpty()) {
				console.log(result.array());
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				Users.update(request.params.id, request.body, function(err, results, fields) {
					if(err) {
						console.log(err);
						response.status(500).json({status: "fail", message: "MySQL error", errors: err});
					} else {
						response.json({status: "success", message: "User password updated!"});
					}
				});
			}
		});			
	} else {
		response.sendStatus(401);
	}
});



app.delete('/users/:id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user.admin) {
		result = Users.delete(request.params.id, function(err, results, fields) {
			if(err) {
				console.log(err);
				response.status(500).json({status: "fail", message: "System error."});
			} else {
				response.json({status: "success", message: "User deleted.", user_id: request.params.id});
			}
		});
	} else {
		response.sendStatus(401);
	}
});

app.listen(app.get('port'), function() {
	console.log('Express started on http://localhost:'+
		app.get('port') + '; press Ctrl-C to terminate.');

		console.log("NODE_ENV="+app.get('env'));

	if(app.get('env') == "development" || app.get('env') == "remote_development") {
		//Seed fake data
		seeder.seed_data(app);
	}
});

module.exports = app;