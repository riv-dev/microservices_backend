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
var mkdirp = require('mkdirp');


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
	const dir = 'uploads/'
	mkdirp(dir, err => cb(err, dir))
  },
  filename: function (req, file, cb) {
    cb(null, 'project_' + req.params.id + "_" + Date.now() + path.extname(file.originalname));
  }
})

var upload = multer({ storage: storage });

//Configuration
var port = {
	development: 8004,
	test: 7004,
	production: 5004
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
var ProjectPhotos = require('./models/ProjectPhotos.js');
ProjectPhotos.connect(app.get('env'));

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
	response.send("Welcome to the Project Photos API");
});

app.get('/projects/:id/photo', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	result = ProjectPhotos.find_by_project_id(request.params.id, function(err,rows,fields) {
		if(err) {
			response.send(err);
		} else {
			if(rows && rows.length > 0) {
				response.json({id: rows[0].id, project_id: rows[0].project_id, name: rows[0].name, caption: rows[0].caption, photo_uri: "/projects/" + request.params.id + "/photo.image"});
			} else {
				response.sendStatus(404);
			}
		}
	});
});

app.get('/projects/:id/photo.image', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	result = ProjectPhotos.find_by_project_id(request.params.id, function(err,rows,fields) {
		if(err) {
			response.send(err);
		} else {
			if(rows && rows.length > 0) {
				response.setHeader('Content-Type', rows[0].mimetype);
				response.sendFile(__dirname + "/" + rows[0].filepath);
			} else {
				response.sendStatus(404);
			}
		}
	});
});

app.post('/projects/:id/photo', upload.single('photo'), express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response, next) {
	if(request.user) {
		console.log("Valid project");
		request.checkBody('name', "can't be empty").notEmpty();

		request.getValidationResult().then(function(result) {
			if (!result.isEmpty() || !request.file) {
				//Manually add error for file, express validator lib does not check request.file
				if(!request.file) {
					result.array().push({param: 'photo', msg: "can't be empty"});
				}

				console.log(JSON.stringify(result.array()));
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				ProjectPhotos.find_by_project_id(request.params.id, function(err, rows, fields) {
					requestBody = {
						project_id: request.params.id, 
						name: request.body.name,
						caption: request.body.caption,
						filepath: request.file.path,
						mimetype: request.file.mimetype
					};
					//Delete from the filesystem
					if(rows && rows.length > 0) {
						for(var i=0;i<rows.length;i++) {
							console.log("Deleting: " + rows[i].filepath);
							fs.unlink(__dirname + "/" + rows[i].filepath, function() {});
						}

						ProjectPhotos.update(request.params.id, requestBody, function(err, rows, fields) {
							if(err) {
								console.log(err);
								response.status(400).json({status: "fail", message: "MySQL error", errors: err});
							} else {
								response.json({status: "success", message: "Project Photo Updated!"});
							}
						});
					} else {
						//Add new entry in the database
						ProjectPhotos.add(requestBody, function(err, results, fields) {
							if(err) {
								console.log(err);
								response.status(500).json({status: "fail", message: "System error."});
							} else {
								response.send({status: "success", message: "Project photo added!", project_id: results.project_id});
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

app.put('/projects/:id/photo', upload.single('photo'), express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response, next) {
	if(request.user) {
		requestBody = {}

		request.checkBody('name', "can't be empty").optional().notEmpty();


		request.getValidationResult().then(function(result) {
			if (!result.isEmpty()) {
				console.log(result.array());
				response.status(400).json({status: "fail", message: "Validation error", errors: result.array()});
				return;
			} else {
				ProjectPhotos.find_by_project_id(request.params.id, function(err, rows, fields) {
					if(rows && rows.length > 0) {
						if(request.file) {
							requestBody.filepath = request.file.path;
							requestBody.mimetype = request.file.mimetype;

							//delete the old file in the filesystem
							for(var i　=　0;　i　<　rows.length;　i++) {
								console.log("Deleting: " + rows[i].filepath);
								fs.unlink(__dirname + "/" + rows[i].filepath, function() {});
							}
						}
						
						if(request.body.name) {
							requestBody.name = request.body.name;
						}

						if(request.body.caption) {
							requestBody.caption = request.body.caption;
						}

						ProjectPhotos.update(request.params.id, requestBody, function(err, rows, fields) {
							if(err) {
								console.log(err);
								response.status(400).json({status: "fail", message: "MySQL error", errors: err});
							} else {
								response.json({status: "success", message: "Project Photo Updated!"});
							}
						});				
					} else {
						response.status(400).json({status: "fail", message: "No record", errors: ''});
					}
				});
			}
		});
	} else {
		response.sendStatus(401);
	}

});

app.delete('/projects/:id/photo', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		ProjectPhotos.find_by_project_id(request.params.id, function(err, rows, fields) {
			//Delete from the filesystem
			if(rows && rows.length > 0) {
				for(var i=0;i<rows.length;i++) {
					console.log("Deleting: " + rows[i].filepath);
					fs.unlink(__dirname + "/" + rows[i].filepath, function() {});
				}

				//Delete the entry in the database
				ProjectPhotos.delete(request.params.id, function(err, rows, fields) {
					response.send({status: "success", message: "Project Photo Deleted!"});
				});	
			} else {
				response.sendStatus(404);
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

module.exports = app;