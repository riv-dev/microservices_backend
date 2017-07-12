var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var jwt = require('jsonwebtoken');
var express_jwt = require('express-jwt');
var credentials = require('./credentials');
var morgan = require('morgan'); //for logging HTTP requests
var expressValidator = require('express-validator');
var moment = require('moment');

//Configuration
app.set('port',process.env.PORT || 5003);
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
var Tasks = require('./models/tasks.js');
Tasks.connect();

var TaskAssignments = require('./models/task_assignments.js');
TaskAssignments.connect();

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

//////////////////
// GET Requests //
//////////////////
app.get('/', function(request, response) {
	response.send("Welcome to the Tasks API.");
});

//app.get('/tasks');
app.get('/tasks', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	Tasks.find_all(request.query, function(err,results,fields) {
		if(err) {
			console.log(err);
			response.status(500).json({status: "fail", message: "System error."});
		} else {
			response.json(results);
		}
	});
});

//app.get('/tasks/:id'); entire task details
app.get('/tasks/:id', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	Tasks.find_by_id(request.params.id, function(err,results,fields) {
		if(err) {
			console.log(err);
			response.status(500).json({status: "fail", message: "System error."});
		} else {
			response.json(results[0]);
		}
	});
});

app.get('/tasks-with-name-like/:name_str', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	Tasks.find_name_like(request.params.name_str, function(err,results,fields) {
		if(err) {
			console.log(err);
			response.status(500).json({status: "fail", message: "System error."});
		} else {
			response.json(results[0]);
		}
	});
});

//List routes
//app.get('/tasks/:id/users');
app.get('/tasks/:task_id/users', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	//Tasks.find_all_users(:task_id)
	TaskAssignments.find_all_users_by_task_id(request.params.task_id, function(err,results,fields) {
		if(err) {
			console.log(err);
			response.status(500).json({status: "fail", message: "System error."});
		} else {
			response.json(results);
		}
	});
});

//app.get('/users/:id/tasks');
app.get('/users/:user_id/tasks', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	Tasks.find_all_by_user_id(request.query, request.params.user_id, function(err,results,fields) {
		if(err) {
			console.log(err)
			response.status(500).json({status: "fail", message: "System error."});
		} else {
			response.json(results);
		}
	});
});

//app.get('/projects/:project_id/tasks');
app.get('/projects/:project_id/tasks', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response) {
	request.query.project_id = request.params.project_id;

	Tasks.find_all(request.query, function(err,results,fields) {
		if(err) {
			console.log(err)
			response.status(500).json({status: "fail", message: "System error."});
		} else {
			response.json(results);
		}
	});
});

//Detail routes
//app.get('/tasks/:task_id/users/:user_id); details of user regarding task (e.g. permissions)
app.get('/tasks/:task_id/users/:user_id', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	//TaskAssignments.find(:task_id,:user_id)
	TaskAssignments.find_task_assignment(request.params.task_id, request.params.user_id, function(err, results, fields) {
		if(err) {
			console.log(err);
			response.status(500).json({status: "fail", message: "System error."});
		} else {
			response.json(results[0]);
		}
	});
});

//app.get('/users/:user_id/tasks/:task_id); details of task regarding user (e.g. permissions)
app.get('/users/:user_id/tasks/:task_id', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	//TaskAssignments.find(:task_id,:user_id)
	TaskAssignments.find_task_assignment(request.params.task_id, request.params.user_id, function(err, results, fields) {
		if(err) {
			console.log(err);
			response.status(500).json({status: "fail", message: "System error."});
		} else {
			response.json(results[0]);
		}
	});
});


///////////////////
// POST Requests //
///////////////////
app.options('/tasks', function(request, response) {
	response.header("Allow", "GET,POST,OPTIONS");
	response.json({methods: ["GET","POST"], POST: {body: Tasks.schema}});
});

//app.post('/tasks');
app.post('/tasks', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		request.checkBody('name', "can't be empty").notEmpty();
		request.checkBody('status',"options are: [new, doing, finished]").optional().matches(/\b(?:new|doing|finished)\b/);
		request.checkBody('deadline',"must be a valid date in ISO8601 format").optional().isISO8601();
		
		request.getValidationResult().then(function(result) {

			if (!result.isEmpty()) {
				console.log(JSON.stringify(result.array()));
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				request.body.creator_user_id = request.user.id;
				if(request.body.deadline) {
					request.body.deadline = moment(request.body.deadline).format("YYYY-MM-DD HH:mm:ss");
				}

				Tasks.add(request.body, function(err, results, fields) {
					if(err) {
						response.status(500).json({status: "fail", message: "MySQL error", errors: err});
					} else {
						response.json({status: "success", message: "Task added!", task_id: results.insertId});
					}
				});
			}
		});		
	} else {
		response.sendStatus(401);
	}
});

app.options('/projects/:project_id/tasks', function(request, response) {
	response.header("Allow", "GET,POST,OPTIONS");
	response.json({methods: ["GET","POST"], POST: {body: Tasks.schema}});
});

app.post('/projects/:project_id/tasks', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Need to add API request to Projects service to see if the user is on the project

	if(request.user) {
		request.checkBody('name', "can't be empty").notEmpty();
		request.checkBody('status',"options are: [new, doing, finished]").optional().matches(/\b(?:new|doing|finished)\b/);
		request.checkBody('deadline',"must be a valid date in ISO8601 format").optional().isISO8601();
	
		request.getValidationResult().then(function(result) {

			if (!result.isEmpty()) {
				console.log(JSON.stringify(result.array()));
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				request.body.creator_user_id = request.user.id;
				request.body.project_id = request.params.project_id;
				if(request.body.deadline) {
					request.body.deadline = moment(request.body.deadline).format("YYYY-MM-DD HH:mm:ss");
				}

				Tasks.add(request.body, function(err, results, fields) {
					if(err) {
						response.status(500).json({status: "fail", message: "MySQL error", errors: err});
					} else {
						response.json({status: "success", message: "Task added!", task_id: results.insertId});
					}
				});
			}
		});		
	} else {
		response.sendStatus(401);
	}
});

app.options('/tasks/:task_id/users/:user_id', function(request, response) {
	response.header("Allow", "GET,POST,OPTIONS");
	response.json({methods:["GET","POST"], POST: {description: "Add a user to a task", notes: "task_id and user_id is defined in the URL, not the body", body: TaskAssignments.schema}});
});

//Add routes
//app.post('/tasks/:id/users');
app.post('/tasks/:task_id/users/:user_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Add a user to a task
	if(request.user) {
		TaskAssignments.find_task_assignment(request.params.task_id, request.params.user_id, function(err, results, fields) {
			if(err) {
				response.status(500).json({status: "fail", message: "A system error occured."});
			}
			else if(results && results.length > 0) {
				//already exists
				response.status(400).json({status: "fail", message: "User already assigned to task."});
			} else {
				TaskAssignments.add(request.params.task_id, request.params.user_id, "Added to task.", function(err, results, fields) {
					if(err) {
						response.status(500).json({status: "fail", message: "A system error occured."});
					} else {
						response.json({status: "success", message: "User added to the task!"});
					}
				});
			}
		});
	} else {
		response.sendStatus(401);		
	}
});

////////////////////
/// PUT Requests ///
////////////////////

app.options('/tasks/:id', function(request, response) {
	response.header("Allow", "GET,PUT,DELETE,OPTIONS");
	response.json({methods: ["GET","PUT","DELETE"], PUT: {body: Tasks.schema}});
});

//app.put('/tasks/:task_id')
app.put('/tasks/:id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		TaskAssignments.find_task_assignment(request.params.id,request.user.id, function(err,results,fields) {
			if(request.user.admin || (results && results.length >= 1)) { 
				request.checkBody('name', "can't be empty").optional().notEmpty();
				request.checkBody('status',"options are: [new, doing, finished]").optional().matches(/\b(?:new|doing|finished)\b/);
				request.checkBody('deadline',"must be a valid date in ISO8601 format").optional().isISO8601();
	

				request.getValidationResult().then(function(result) {
					if (!result.isEmpty()) {
						console.log(result.array());
						response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
						return;
					} else {
						if(request.body.deadline) {
							request.body.deadline = moment(request.body.deadline).format("YYYY-MM-DD HH:mm:ss");
						}

						Tasks.update(request.params.id, request.body, function(err, results, fields) {
							if(err) {
								console.log(err);
								response.status(400).json({status: "fail", message: "MySQL error", errors: err});
							} else {
								response.json({status: "success", message: "Task updated!"});
							}
						});
					}
				});			
			} else {
				Tasks.find_by_id(request.params.id, function(err, results, fields) {
					if(results && results.length > 0 && results[0].user_id == request.user.id) {
						request.checkBody('name', "can't be empty").optional().notEmpty();
						request.checkBody('status',"options are: [new, doing, finished]").optional().matches(/\b(?:new|doing|finished)\b/);

						request.getValidationResult().then(function(result) {
							if (!result.isEmpty()) {
								console.log(result.array());
								response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
								return;
							} else {
								Tasks.update(request.params.id, request.body, function(err, results, fields) {
									if(err) {
										console.log(err);
										response.status(400).json({status: "fail", message: "MySQL error", errors: err});
									} else {
										response.json({status: "success", message: "Task updated!"});
									}
								});
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

app.options('/users/:user_id/tasks/:task_id', function(request, response) {
	response.header("Allow", "GET,PUT,DELETE,OPTIONS");
	response.json({methods: ["GET","PUT","DELETE"], PUT: {notes: "task_id and user_id is defined in the URL, not the body", body: TaskAssignments.schema}});
});

//app.put('/users/:user_id/tasks/:task_id')
app.put('/users/:user_id/tasks/:task_id',  express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Edit user permissions
	if(request.user) {
		TaskAssignments.find_task_assignment(request.params.task_id,request.user.id, function(err,results,fields) {
			if(request.user.admin || (results && results.length >= 1)) {
				TaskAssignments.update(request.params.task_id, request.params.user_id, request.body, function(err, results, fields) {
					if(err) {
						console.log(err);
						response.status(400).json({status: "fail", message: "MySQL error", errors: err});
					} else {
						response.json({status: "success", message: "Task assignment updated!"});
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

///////////////////////
/// DELETE Requests ///
///////////////////////

//app.delete(/tasks/:id) remove an entire task
app.delete('/tasks/:id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		TaskAssignments.find_task_assignment(request.params.id,request.user.id, function(err,results,fields) {
			if(request.user.admin || (results && results.length >= 1)) { 
				Tasks.delete(request.params.id, function(err, results, fields) {
					if(err) {
						console.log(err);
						response.status.json({status: "fail", message: "System error."});
					} else {
						TaskAssignments.delete_all(request.params.id, function(err, results, fields) {
							response.json({message: "Task deleted."});
						});
					}
				});
			} else {
				Tasks.find_by_id(request.params.id, function(err, results, fields) {
					if(results && results.length > 0 && results[0].user_id == request.user.id) {
						Tasks.delete(request.params.id, function(err, results, fields) {
							if(err) {
								console.log(err);
								response.status.json({status: "fail", message: "System error."});
							} else {
								TaskAssignments.delete_all(request.params.id, function(err, results, fields) {
									response.json({message: "Task deleted."});
								});
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

//app.delete(/users/:user_id/tasks/:task_id) remove a task from a user
app.delete('/users/:user_id/tasks/:task_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		TaskAssignments.find_task_assignment(request.params.id,request.user.id, function(err,results,fields) {
			if(request.user.admin || request.user.id == request.params.user_id || (results && results.length >= 1)) { 
				TaskAssignments.delete(request.params.task_id, request.params.user_id, function(err, results, fields) {
						if(err) {
							console.log(err);
							response.status(400).json({status: "fail", message: "MySQL error", errors: err});
						} else {
							response.json({status: "success", message: "Removed self from task."});
						}
				});
			} else {
				Tasks.find_by_id(request.params.id, function(err, results, fields) {
					if(results && results.length > 0 && results[0].user_id == request.user.id) {
						TaskAssignments.delete(request.params.task_id, request.params.user_id, function(err, results, fields) {
								if(err) {
									console.log(err);
									response.status(400).json({status: "fail", message: "MySQL error", errors: err});
								} else {
									response.json({status: "success", message: "Removed self from task."});
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

app.listen(app.get('port'), function() {
	console.log('Express started on http://localhost:'+
		app.get('port') + '; press Ctrl-C to terminate.');
});