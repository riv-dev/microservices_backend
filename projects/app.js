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
var seeder = require('./seeder');

//Configuration
app.set('port',process.env.PORT || 5002);
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
var Projects = require('./models/projects.js');
Projects.connect(app.get('env'));

var ProjectUsers = require('./models/project_users.js');
ProjectUsers.connect(app.get('env'));

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
	response.send("Welcome to the Projects API.  Updated the code!  Updated again!");
});

//List routes
//app.get('/projects/:id/users');
app.get('/projects/:project_id/users', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	//Projects.find_all_users(:project_id)
	ProjectUsers.find_all_users_by_project_id(request.params.project_id, function(err,results,fields) {
		if(err) {
			response.send(err);
		} else {
			if(results && results.length > 0) {
				var idsArrStr = "ids=";
				var indexedResults = {};
				for(var i=0;i<results.length;i++) {
					//build ids array
					idsArrStr += results[i].user_id;
					indexedResults[results[i].user_id] = results[i]; //index for faster searching

					if(i < results.length-1) {
						idsArrStr += ",";
					}
				}

				var users_service_url;
				switch(app.get('env')) {
					case 'development':
						users_service_url = api_urls.local_development.users_service;
						break;
					case 'remote_development':
						users_service_url = api_urls.remote_development.users_service;
						break;
					case 'production':
						users_service_url = api_urls.production.users_service;
						break;
					default:
						throw new Error('Unknown execution environment: ' + app.get('env'));
				}

				httpRequest(users_service_url + "/users?" + idsArrStr, function(error, httpResponse, body) {
					if(error) {
						//return without the user details
						console.log("Error: " + error);
						response.json(results);
					} else {
						//return with the user details
						var users = JSON.parse(body);
						for(var i=0;i<users.length;i++) {
							users[i] = extend(users[i], indexedResults[users[i].id]);
						}
						response.json(users);
					}
				});
			} else {
				response.json([]);
			}
		}
	});
});

//app.get('/users/:id/projects-count');
app.get('/users/:user_id/projects-count', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	Projects.count_all_by_user_id(request.query, request.params.user_id, function(err,results,fields) {
		if(err) {
			response.send(err);
		} else {
			response.json(results[0].num_rows);
		}
	});
});

//app.get('/users/:id/projects');
app.get('/users/:user_id/projects', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	Projects.find_all_by_user_id(request.query, request.params.user_id, function(err,results,fields) {
		if(err) {
			response.send(err);
		} else {
			response.json(results);
		}
	});
});

//app.get('/projects-count');
app.get('/projects-count', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	Projects.count_all(request.query, function(err,results,fields) {
		if(err) {
			response.send(err);
		} else {
			response.json(results[0].num_rows);
		}
	});
});

//app.get('/projects');
app.get('/projects', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	Projects.find_all(request.query, function(err,results,fields) {
		if(err) {
			response.send(err);
		} else {
			response.json(results);
		}
	});
});

//Detail routes
//app.get('/projects/:project_id/users/:user_id); details of user regarding project (e.g. permissions)
app.get('/projects/:project_id/users/:user_id', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	//ProjectUsers.find(:project_id,:user_id)
	ProjectUsers.find_project_user_pairing(request.params.project_id, request.params.user_id, function(err, results, fields) {
		if(err) {
			response.send(err);
		} else {
			response.json(results[0]);
		}
	});
});

//app.get('/users/:user_id/projects/:project_id); details of project regarding user (e.g. permissions)
app.get('/users/:user_id/projects/:project_id', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	//ProjectUsers.find(:project_id,:user_id)
	ProjectUsers.find_project_user_pairing(request.params.project_id, request.params.user_id, function(err, results, fields) {
		if(err) {
			response.send(err);
		} else {
			response.json(results[0]);
		}
	});
}); 

//app.get('/projects/:id'); entire project details
app.get('/projects/:id', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	Projects.find_by_id(request.params.id, function(err,results,fields) {
		if(err) {
			response.send(err);
		} else {
			response.json(results[0]);
		}
	});
});

//Add routes
//app.post('/projects/:id/users');
app.post('/projects/:project_id/users', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Add a user to a project
	if(request.user) {
		ProjectUsers.find_project_user_pairing(request.params.project_id,request.user.id, function(err,results,fields) {
			if(request.user.admin || (results && results.length >= 1 && results[0].write_access > 0)) {	
				ProjectUsers.find_project_user_pairing(request.params.project_id,request.body.user_id, function(err,results,fields) {	
					if(err) {
						response.status(500).json({status: "fail", message: "A system error occured."});
					}
					else if(results && results.length > 0) {
						//already exists
						response.status(400).json({status: "fail", message: "User already assigned to project."});
					} else {
						request.checkBody('user_id', "can't be empth").notEmpty();
						request.checkBody('status',"options are: [active, inactive]").optional().matches(/\b(?:active|inactive)\b/);
						request.checkBody('write_access', "options are: [0, 1, 2]").optional().matches(/\b(?:0|1|2)\b/);

						request.getValidationResult().then(function(result) {
							if (!result.isEmpty()) {
								console.log(result.array());
								response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
								return;
							} else {
								ProjectUsers.add(request.params.project_id, request.body.user_id, request.body.role, "active", request.body.write_access, function(err, results, fields) {
									if(err) {
										console.log(err);
										response.status(400).json({status: "fail", message: "MySQL error", errors: err});
									} else {
										response.json({status: "success", message: "User added to project!", project_id: request.params.project_id, user_id: request.body.user_id});
									}
								});
							}
						});	//end getValidationResult()	
					} //end else
				}); //end ProjectUsers.find_project_user_pairing
			} else {
				response.sendStatus(401);
			}
		});
	} else {
		response.sendStatus(401);		
	}
});

/*app.post('/users/:user_id/projects', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Request to be added to a project
	if(request.user && request.user.id == request.params.user_id) {
		request.checkBody('project_id', "can't be empth").notEmpty();
		request.checkBody('project_id', "must be numeric").isInt();

		request.getValidationResult().then(function(result) {
			if (!result.isEmpty()) {
				console.log(result.array());
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				ProjectUsers.add(request.body.project_id, request.params.user_id, "User Requested", request.body.write_access, function(err, results, fields) {
					if(err) {
						console.log(err);
						response.status(400).json({status: "fail", message: "MySQL error", errors: err});
					} else {
						response.json({status: "success", message: "Project requested"});
					}
				});
			}
		});	
	} else {
		response.sendStatus(401);	
	}
});*/

app.options('/projects', function(request, response) {
	response.header("Allow", "GET,POST,OPTIONS");
	response.json({methods: ["GET","POST"], POST: {body: Projects.schema}});
});

//app.post('/projects');
app.post('/projects', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		//(id int NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL, description varchar(255), source_code_url varchar(255), development_server_url varchar(255), production_server_url varchar(255), PRIMARY KEY(id)
		request.checkBody('name', "can't be empty").notEmpty();
		request.checkBody('status',"options are: [new, doing, finished]").optional().matches(/\b(?:new|doing|finished)\b/);
		request.checkBody('start_date',"must be a valid date in ISO8601 format").optional().isISO8601();
		request.checkBody('deadline',"must be a valid date in ISO8601 format").optional().isISO8601();
		
		request.getValidationResult().then(function(result) {
			if (!result.isEmpty()) {
				console.log(JSON.stringify(result.array()));
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				if(request.body.start_date) {
					request.body.start_date = moment(request.body.start_date).format("YYYY-MM-DD HH:mm:ss");
				}

				if(request.body.deadline) {
					request.body.deadline = moment(request.body.deadline).format("YYYY-MM-DD HH:mm:ss");
				}

				Projects.add(request.body, function(err, results, fields) {
					if(err) {
						response.status(400).json({status: "fail", message: "MySQL error", errors: err});
					} else {
						ProjectUsers.add(results.insertId, request.user.id, null, "active", 2, function(err, resultTwo, fields) {
							response.json({status: "success", message: "Project added!", project_id: results.insertId});
						}); //Give level 2 write permissions
					}
				});
			}
		});		
	} else {
		response.sendStatus(401);
	}
});

app.options('/projects/:project_id/users/:user_id', function(request, response) {
	response.header("Allow", "GET,PUT,DELETE,OPTIONS");
	response.json({methods:["GET","PUT","DELETE"], PUT: {notes: "project_id and user_id is defined in the URL, not the body", body: ProjectUsers.schema}});
});

//Edit routes
//app.put('/projects/:project_id/users/:user_id')
app.put('/projects/:project_id/users/:user_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Edit user permissions
	if(request.user) {
		//(id int NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL, description varchar(255), source_code_url varchar(255), development_server_url varchar(255), production_server_url varchar(255), PRIMARY KEY(id)
		request.checkBody('status',"options are: [active, inactive]").optional().matches(/\b(?:active|inactive)\b/);
		request.checkBody('write_access', "options are: [0, 1, 2]").optional().matches(/\b(?:0|1|2)\b/);
		
		request.getValidationResult().then(function(result)  {
			if (!result.isEmpty()) {
				console.log(JSON.stringify(result.array()));
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				ProjectUsers.find_project_user_pairing(request.params.project_id,request.user.id, function(err,results,fields) {
					if(request.user.admin || (results && results.length >= 1 && results[0].write_access > 1)) {
						ProjectUsers.update(request.params.project_id, request.params.user_id, request.body, function(err, results, fields) {
							if(err) {
								console.log(err);
								response.status(400).json({status: "fail", message: "MySQL error", errors: err});
							} else {
								response.json({status: "success", message: "Project permissions updated!", project_id: request.params.project_id});
							}
						});
					} else {
						response.sendStatus(401);
					}
				});
			}
		});
	} else {
		response.sendStatus(401);
	}
});

app.options('/users/:user_id/projects/:project_id', function(request, response) {
	response.header("Allow", "GET,PUT,DELETE,OPTIONS");
	response.json({methods:["GET","PUT","DELETE"], PUT: {notes: "project_id and user_id is defined in the URL, not the body", body: ProjectUsers.schema}});
});

//app.put('/users/:user_id/projects/:project_id')
app.put('/users/:user_id/projects/:project_id',  express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Edit user permissions
	if(request.user) {
		//(id int NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL, description varchar(255), source_code_url varchar(255), development_server_url varchar(255), production_server_url varchar(255), PRIMARY KEY(id)
		request.checkBody('status',"options are: [active, inactive]").optional().matches(/\b(?:active|inactive)\b/);
		request.checkBody('write_access', "options are: [0, 1, 2]").optional().matches(/\b(?:0|1|2)\b/);
		
		request.getValidationResult().then(function(result)  {
			if (!result.isEmpty()) {
				console.log(JSON.stringify(result.array()));
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				ProjectUsers.find_project_user_pairing(request.params.project_id,request.user.id, function(err,results,fields) {
					if(request.user.admin || (results && results.length >= 1 && results[0].write_access > 1)) {
						ProjectUsers.update(request.params.project_id, request.params.user_id, request.body, function(err, results, fields) {
							if(err) {
								console.log(err);
								response.status(400).json({status: "fail", message: "MySQL error", errors: err});
							} else {
								response.json({status: "success", message: "Project permissions updated!", project_id: request.params.project_id});
							}
						});
					} else {
						response.sendStatus(401);
					}
				});
			}
		});
	} else {
		response.sendStatus(401);
	}
});

app.options('/projects/:id', function(request, response) {
	response.header("Allow", "GET,PUT,DELETE,OPTIONS");
	response.json({methods:["GET","PUT","DELETE"],PUT:{body:Projects.schema}});
});

//app.put('/projects/:project_id')
app.put('/projects/:id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Allow admin, creator of project, and people with project write access to edit the project
	//Have another database inside the same micro-service with user/project permissions
	//Allow admin and owner of the account to modify attributes
	if(request.user) {
		ProjectUsers.find_project_user_pairing(request.params.id,request.user.id, function(err,results,fields) {
			if(request.user.admin || (results && results.length >= 1 && results[0].write_access > 0)) { 
				request.checkBody('name', "can't be empty").optional().notEmpty();
				request.checkBody('status',"options are: [new, doing, finished]").optional().matches(/\b(?:new|doing|finished)\b/);
				request.checkBody('start_date',"must be a valid date in ISO8601 format").optional().isISO8601();
				request.checkBody('deadline',"must be a valid date in ISO8601 format").optional().isISO8601();	

				request.getValidationResult().then(function(result) {
					if (!result.isEmpty()) {
						console.log(result.array());
						response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
						return;
					} else {
						if(request.body.start_date) {
							request.body.start_date = moment(request.body.start_date).format("YYYY-MM-DD HH:mm:ss");
						}

						if(request.body.deadline) {
							request.body.deadline = moment(request.body.deadline).format("YYYY-MM-DD HH:mm:ss");
						}

						Projects.update(request.params.id, request.body, function(err, results, fields) {
							if(err) {
								console.log(err);
								response.status(400).json({status: "fail", message: "MySQL error.  Check all field names are correct.", errors: err});
							} else {
								response.json({status: "success", message: "Project updated!", project_id: request.params.id});
							}
						});
					}
				});			
			} else {
				response.sendStatus(401);
			}
		});
	} else {
		response.sendStatus(401);
	}
});

//app.delete(/projects/:project_id/users/:user_id) remove a user from the project
app.delete('/projects/:project_id/users/:user_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Edit user permissions
	if(request.user) {
		ProjectUsers.find_project_user_pairing(request.params.project_id,request.user.id, function(err,results,fields) {
			if(request.user.admin || (results && results.length >= 1 && results[0].write_access > 1)) {
				ProjectUsers.delete(request.params.project_id, request.params.user_id, function(err, results, fields) {
					if(err) {
						console.log(err);
						response.status(400).json({status: "fail", message: "MySQL error", errors: err});
					} else {
						response.json({status: "success", message: "User deleted from project.", project_id: request.params.project_id});
					}
				});
			} else {
				response.sendStatus(401);
			}
		});
	} else {
		response.sendStatus(401);
	}	
});

//app.delete(/users/:user_id/projects/:project_id) remove a project from a user
app.delete('/users/:user_id/projects/:project_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Edit user permissions
	if(request.user && request.user.id == request.params.user_id) {
		ProjectUsers.delete(request.params.project_id, request.params.user_id, function(err, results, fields) {
			if(err) {
				console.log(err);
				response.status(400).json({status: "fail", message: "MySQL error", errors: err});
			} else {
				response.json({status: "success", message: "Removed self from project.", project_id: request.params.project_id});
			}
		});
	} else {
		response.sendStatus(401);
	}
});

//app.delete(/projects/:id) remove an entire project
app.delete('/projects/:project_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		ProjectUsers.find_project_user_pairing(request.params.project_id, request.user.id, function(err, results, fields) {
			if(request.user.admin || (results && results.length > 0 && results[0].write_access == 2)) {
				Projects.delete(request.params.project_id, function(err, results, fields) {
					if(err) {
						response.status(500).json({status: "fail", message: "System error."});
					} else {
						ProjectUsers.delete_all(request.params.project_id, function(err, results, fields) {
							response.json({message: "Project deleted."});
						});
					}
				});
			} else {
				response.sendStatus(401);
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