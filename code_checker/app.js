var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var express_jwt = require('express-jwt');
var credentials = require('./credentials');
var morgan = require('morgan'); //for logging HTTP requests
var expressValidator = require('express-validator');
var api_urls = require('./api-urls');
var moment = require('moment');
var exec = require("child_process").exec;

//Configuration
var port = {
	development: 8100,
	test: 7100,
	production: 5100
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
var CodeCheckerProjects = require('./models/code_checker_projects.js');
var URLsToCheck = require('./models/urls_to_check.js');
var ResultMessages = require('./models/result_messages.js');
CodeCheckerProjects.connect(app.get('env'), function() {
	URLsToCheck.connect(app.get('env'));
	ResultMessages.connect(app.get('env'));
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
	response.send("Welcome to the Code Checker Projects API.");
});

app.get('/code-checker-projects', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	CodeCheckerProjects.find_all(request.query, function(err,results,fields) {
		if(err) {
			response.send(err);
		} else {
			response.json(results);
		}
	});
});

app.get('/code-checker-projects/:id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response, next) {
	CodeCheckerProjects.find_by_project_id(request.params.id, function(err,results,fields) {
		if(err) {
			response.send(err);
		} else {
			if(results && results.length > 0) {
				response.json(results[0]);
			} else {
				response.sendStatus(404);
			}
		}
	});
});

app.get('/code-checker-projects/:id/urls-to-check', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response, next) {
	URLsToCheck.find_all_by_project_id(request.params.id, function(err,results,fields) {
		if(err) {
			response.send(err);
		} else {
			response.json(results);
		}
	});
});

app.get('/code-checker-projects/:id/result-messages', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response, next) {
	ResultMessages.find_all_by_project_id(request.params.id, function(err,results,fields) {
		if(err) {
			response.send(err);
		} else {
			response.json(results);
		}
	});
});

//Run code-checker on a project
app.put('/code-checker-projects/:id/run', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	//Code Checker must be installed on the computer running this application
	//Visit for installation details: https://github.com/riv-dev/code_checker
	CodeCheckerProjects.find_by_project_id(request.params.id, function(err, results, fields) {
		if(err) {
			response.send({status: "fail", message: "MySQL Error", errors: err.sqlMessage});
		} else {
			var project = results[0];
			var dev_server_url = project.development_server;

			URLsToCheck.find_all_by_project_id(request.params.id, function(err, results, fields) {
				if(err) {
					response.send({status: "fail", message: "MySQL Error", errors: err.sqlMessage});
				} else {
					var urls_to_check = results;

					if(dev_server_url && urls_to_check && urls_to_check.length > 0) {
						var urls_to_check_arr = [] 

						for(var i=0;i<urls_to_check.length;i++) {
							urls_to_check_arr.push(urls_to_check[i].url);
						}

						var urls_to_check_str = urls_to_check_arr.join(",");

						var execution_str = "";
						execution_str = "code_checker -l " + urls_to_check_str + " -r " + dev_server_url + " -W ";						

						if(project.dev_server_username && project.dev_server_password) {
							var username = project.dev_server_username;
							var password = project.dev_server_password; 
							execution_str = execution_str + " -u " + username + " -p " + password;
						}

						console.log("Running code_checker...");
						console.log("Execution string: " + execution_str);

						exec(execution_str, function (err, stdout, stderr) {
							if(err) {
								response.status(500).json({status: "fail", message: "An error occured while running code_checker. Most likely have to debug code_checker source code.", errors: err})
							}
							try {
								var output = stdout.replace(/invalid byte sequence in US-ASCII/gi, "");
								var output_json = JSON.parse(output);

								CodeCheckerProjects.update(request.params.id, {last_checked: moment().format("YYYY-MM-DD HH:mm:ss")}, function(err, results, fields) {
								});

								//Clear result messages for the project before adding new ones
								ResultMessages.delete_all(request.params.id, function(deleteErrs, deleteResults, deleteFields) {
									if(deleteErrs) {
										response.status(500).json({status: "fail", message: "MySQL Error", errors: deleteErrs});
									} else {
										var all_result_message_bodies = []

										for (var i = 0; i < output_json.length; i++) {
											var checked_file = output_json[i];

											for (var j = 0; j < checked_file.errors.length; j++) {
												var current_message = checked_file.errors[j];

												var result_message_body = {
													msg_level: "error",
													msg_type: current_message.type,
													msg: current_message.message,
													line_num: current_message.line_num,
													source: current_message.source,
													project_id: request.params.id
												}

												all_result_message_bodies.push(result_message_body);
											}

											for (var j = 0; j < checked_file.warnings.length; j++) {
												var current_message = checked_file.errors[j];

												var result_message_body = {
													msg_level: "warning",
													msg_type: current_message.type,
													msg: current_message.message,
													line_num: current_message.line_num,
													source: current_message.source,
													project_id: request.params.id
												}

												all_result_message_bodies.push(result_message_body);
											}

										} //End for each output_json file checked

										ResultMessages.bulk_add(all_result_message_bodies, function (err, results, fields) {
											console.log("Done.");
											response.json({ status: "success", message: "Code Checker completed. Please check results", project_id: request.params.id });
										});
									} //End if errs for delete_all SQL
								}); //End delete_all result_messages
							} catch(err) {
								response.status(500).json({status: "fail", message: "An error occured while running code_checker. Most likely have to debug code_checker source code.", errors: err})
							} //End try parse JSON response catch block
						}); //End exec code_checker ruby command 
					} else {
						response.json({status: "alert", message: "No urls to check have been specified."});
					} //End if urls_to_check.length > 0
				} //End if errs for mysql
			}); //End URLsToCheck.find_all_by_project_id

		} //End if err for mysql
	}); //End CodeCheckerProjects.find_by_project_id

});

app.post('/code-checker-projects', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		request.checkBody('project_id', "can't be empty").notEmpty();
		request.checkBody('project_id',"must be an integer").isInt();
		
		request.getValidationResult().then(function(result) {
			if (!result.isEmpty()) {
				console.log(JSON.stringify(result.array()));
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				CodeCheckerProjects.add(request.body, function(err, results, fields) {
					if(err) {
						if(err.code == "ER_DUP_ENTRY") {
							var errors = [{"param":"project_id", "msg":"Code Checker Project already exists for project_id", "project_id": request.body.project_id}];
							response.status(400).json({status: "fail", message: "Validation error", errors: errors});
						} else {
							response.status(400).json({status: "fail", message: "MySQL error", errors: err.sqlMessage});
						}
					} else {
						response.json({status: "success", message: "Code Checker Project added!", project_id: request.body.project_id});
					}
				});
			}
		});		
	} else {
		response.sendStatus(401);
	}
});

app.post('/code-checker-projects/:id/urls-to-check', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		request.checkBody('url', "can't be empty").notEmpty();
		
		request.getValidationResult().then(function(result) {
			if (!result.isEmpty()) {
				console.log(JSON.stringify(result.array()));
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				request.body.project_id = request.params.id;
				URLsToCheck.add(request.body, function(err, results, fields) {
					if(err) {
						if(err.code == 'ER_DUP_ENTRY') {
							var errors = [{"param":"url", "msg":"URL to check already exists for this project.", "url": request.body.url}];
							response.status(400).json({status: "fail", message: "Validation error", errors: errors});	
						} else {
							response.status(400).json({status: "fail", message: "MySQL error", errors: err.sqlMessage});
						}
					} else {
						response.json({status: "success", message: "URL to check added!", id: results.insertID});
					}
				});
			}
		});		
	} else {
		response.sendStatus(401);
	}
});

app.put('/code-checker-projects/:id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if (request.user) {
		CodeCheckerProjects.update(request.params.id, request.body, function (err, results, fields) {
			if (err) {
				console.log(err);
				response.status(400).json({ status: "fail", message: "MySQL error.  Check all field names are correct.", errors: err });
			} else {
				response.json({ status: "success", message: "Project updated!", project_id: request.params.id });
			}
		});
	} else {
		response.sendStatus(401);
	}
});

app.delete('/code-checker-projects/:project_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if (request.user) {
		CodeCheckerProjects.delete(request.params.project_id, function (err, results, fields) {
			if (err) {
				console.log(err);
				response.status(500).json({ status: "fail", message: "System error.", errors: err.sqlMessage });
			} else {
				response.json({ message: "Code Checker Project deleted." });
			}
		});
	} else {
		response.sendStatus(401);
	}
});

app.delete('/code-checker-projects/:project_id/urls-to-check/:url_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if (request.user) {
		URLsToCheck.delete(request.params.url_id, function (err, results, fields) {
			if (err) {
				console.log(err);
				response.status(500).json({ status: "fail", message: "System error.", errors: err.sqlMessage });
			} else {
				response.json({status: "success", message: "URL deleted." });
			}
		});
	} else {
		response.sendStatus(401);
	}
});

app.delete('/code-checker-projects/:project_id/urls-to-check', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if (request.user) {
		URLsToCheck.delete_all(request.params.project_id, function (err, results, fields) {
			if (err) {
				console.log(err);
				response.status(500).json({ status: "fail", message: "System error.", errors: err.sqlMessage });
			} else {
				response.json({status: "success", message: "All URL's deleted." });
			}
		});
	} else {
		response.sendStatus(401);
	}
});

app.delete('/code-checker-projects/:id/result-messages', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response, next) {
	//Don't really need to check for request.user, express_jwt plugin will catch and respond accordingly
	ResultMessages.delete_all(request.params.id, function(err,results,fields) {
		if(err) {
			console.log(err)
			response.status(500).json({ status: "fail", message: "System error.", errors: err.sqlMessage });
		} else {
			response.json({status: "success", message: "All result messages deleted."});
		}
	});
});

app.listen(app.get('port'), function() {
	console.log('Express started on http://localhost:'+
		app.get('port') + '; press Ctrl-C to terminate.');

	console.log("NODE_ENV="+app.get('env'));
});