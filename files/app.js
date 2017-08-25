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
	var extname = path.extname(file.originalname);
    cb(null, req.params.category + '_file_' + req.params.id + Date.now() + extname);
  }
});

var upload = multer({ storage: storage });

//Configuration
var port = {
	development: 8006,
	test: 7006,
	production: 5006
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
var Files = require('./models/files.js');
Files.connect(app.get('env'));

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
	response.send("Welcome to the Files API");
});

app.get('/:category/:category_id/files', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	result = Files.find_all_by_parent_id(request.params.category_id, request.params.category, function(err,rows,fields) {
		if(err) {
			response.send(err);
		} else {
			if(rows && rows.length > 0) {
				var results = [];
				for(var i = 0; i < rows.length; i++) {
					var obj = {
						id: rows[i].id, parent_id: rows[i].parent_id, 
						category: rows[i].category, name: rows[i].original_file_name, 
						file_type: rows[i].mimetype, 
						file_uri: "/files/" + rows[i].id + "?filename=" + rows[i].original_file_name
					};
					results.push(obj);
				}
				response.json(results);
			} else {
				response.status(200).json({message: "Empty"});
			}
		}
	});
});

app.get('/files/:file_id', express_jwt({secret: app.get('jwt_secret'), credentialsRequired: false, getToken: getTokenFromHeader}), function(request, response, next) {
	result = Files.find_by_id(request.params.file_id, function(err,rows,fields) {
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

app.post('/:category/:category_id/files', upload.single('file'), express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response, next) {
	if(request.user) {

		if (!request.file) {
			//Manually add error for file, express validator lib does not check request.file
			response.status(400).json({status: "fail", message: "Validation error", errors: [{param: 'file', msg: "can't be empty"}]});
			return;
		} else {
			requestBody = {
				parent_id: request.params.category_id, 
				category: request.params.category,
				original_file_name: request.file.originalname,
				filepath: request.file.path,
				mimetype: request.file.mimetype
			};
			//Add new entry in the database
			Files.add(requestBody, function(err, results, fields) {
				if(err) {
					response.status(500).json({status: "fail", message: "System error."});
				} else {
					Files.find_by_id(results.insertId, function(err, rows, fields) {
						if(err) {
							response.send(err);
						} else if(rows && rows.length > 0) {
							var timestamp = new Date(rows[0].updated_at).getTime();
							response.json({
								status: "success", 
								message: "Success File Added!",
								id: rows[0].id, parent_id: rows[0].parent_id, category: rows[0].category, 
								name: rows[0].original_file_name,
								file_type: rows[0].mimetype, 
								file_uri: "/files/" + rows[0].id + "?filename=" + rows[0].original_file_name + "?ver=" + timestamp
							});
						}
					});
				}
			});
		}
	} else {
		response.sendStatus(401);
	}

});

app.delete('/:category/:category_id/files', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		Files.find_all_by_parent_id(request.params.category_id, request.params.category, function(err, rows, fields) {
			//Delete from the filesystem
			if(rows && rows.length > 0) {
				for(var i = 0; i < rows.length; i++) {
					console.log("Deleting: " + rows[i].filepath);
					fs.unlink(__dirname + "/" + rows[i].filepath, function() {});
				}

				//Delete the entry in the database
				Files.delete_all(request.params.category_id, request.params.category, function(err, rows, fields) {
					response.send({status: "success", message: "Success File Deleted!"});
				});	
			} else {
				response.sendStatus(404);
			}
		});
	} else {
		response.sendStatus(401);
	}
});

app.delete('/files/:file_id', express_jwt({secret: app.get('jwt_secret'), getToken: getTokenFromHeader}), function(request, response) {
	if(request.user) {
		Files.find_by_id(request.params.file_id, function(err, rows, fields) {
			//Delete from the filesystem
			if(rows && rows.length > 0) {
				for(var i = 0; i < rows.length; i++) {
					console.log("Deleting: " + rows[i].filepath);
					fs.unlink(__dirname + "/" + rows[i].filepath, function() {});
				}

				//Delete the entry in the database
				Files.delete(request.params.file_id, function(err, rows, fields) {
					response.send({status: "success", message: "Success File Deleted!"});
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