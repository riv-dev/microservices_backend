var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var jwt = require('jsonwebtoken');
var express_jwt = require('express-jwt');
var credentials = require('./credentials');
var morgan = require('morgan'); //for logging HTTP requests
var bcrypt = require('bcrypt-nodejs'); //for password hashing
var expressValidator = require('express-validator');

//Configuration
app.set('port',process.env.PORT || 5000);
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
Users.connect();

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
	response.send("Welcome to the Users API.");
});

app.get('/users', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	if(request.query.ids) {
		var idsArr = request.query.ids.split(",");
		Users.find_all_by_ids(idsArr, function(err,results,fields) {
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
	if(request.user.admin) {
		request.checkBody('lastname', "can't be empty").notEmpty();
		request.checkBody('lastname', "must be alpha characters").isAlpha();
		request.checkBody('firstname',"can't be empty").notEmpty();
		request.checkBody('firstname', "must be alpha characters").isAlpha();

		if(request.body.email && request.body.email != null)
			request.checkBody('email', 'must be a valid email address').isEmail();

		if(request.body.admin && request.body.admin != null)
			request.checkBody('admin', 'must be boolean value').isBoolean();

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
				Users.add(request.body, function(err, results, field) {
					if(err) {
						console.log(err);
						response.status(500).json({status: "fail", message: "System error."});
					} else {
						response.send({status: "success", message: "User added!"});
					}
				});
			}
		});
	} else {
		response.sendStatus(401);
	}
});

app.put('/users/:id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Allow admin and owner of the account to modify attributes
	if(request.user.admin || request.user.id == request.params.id) {

		request.checkBody('lastname', "can't be empty").optional().notEmpty();
		request.checkBody('lastname', "must be alpha characters").optional().isAlpha();
		request.checkBody('firstname',"can't be empty").optional().notEmpty();
		request.checkBody('firstname', "must be alpha characters").optional().isAlpha();
		if(request.body.email && request.body.email != null)
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

app.delete('/users/:id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user.admin) {
		result = Users.delete(request.params.id, function(err, results, fields) {
			if(err) {
				console.log(err);
				response.status(500).json({status: "fail", message: "System error."});
			} else {
				response.json({status: "success", message: "User deleted."});
			}
		});
	} else {
		response.sendStatus(401);
	}
});

app.listen(app.get('port'), function() {
	console.log('Express started on http://localhost:'+
		app.get('port') + '; press Ctrl-C to terminate.');
});