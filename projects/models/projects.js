var mysql = require('mysql')
var credentials = require('../credentials.js');
var bcrypt = require('bcrypt'); //for password hashing

//The Projects model class
var Projects = function (id, lastname, firstname, title) {

}

//Static Methods and Variables
Projects.db = "Yo!";

Projects.connect = function () {
  this.db = mysql.createConnection({
    host: 'localhost',
    user: credentials.mysql.username,
    password: credentials.mysql.password,
  });

  this.db.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
  });

  Projects.initialize_db();
}

Projects.disconnect = function () {
  this.db.end()
}

Projects.initialize_db = function(call_back) {
  console.log("create_db called.");

  this.db.query('CREATE DATABASE IF NOT EXISTS ryukyu_social_projects_service;', function(err) {
    if(err) {
      console.log(err);
    }
  });

  this.db.query('USE ryukyu_social_projects_service;', function(err) {
    if(err) {
      console.log(err);
    }
  });

  this.db.query('CREATE TABLE IF NOT EXISTS projects (id int NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL, description text, source_code_url varchar(2083), development_server_url varchar(2083), production_server_url varchar(2083), PRIMARY KEY(id));', function(err) {
    if(err) {
      console.log(err);
    } 
  });

}

Projects.find_all = function (call_back) {
  console.log("find_all called.");

  this.db.query('SELECT * FROM projects;', function (err, results, fields) {
    call_back(err, results, fields);
  });
}

Projects.find_all_by_user_id = function(user_id, call_back) {
  console.log("find_all_by_user_id called.");

  this.db.query('SELECT * FROM projects INNER JOIN project_users ON projects.id = project_users.project_id WHERE project_users.user_id = ?;', [user_id], function (err, results, fields) {
    call_back(err, results, fields);
  });
}

Projects.find_by_id = function (id, call_back) {
  console.log("find_by_id called.");

  this.db.query("SELECT * FROM projects WHERE id = ? LIMIT 1;", [id], function (err, results, fields) {
    call_back(err, results, fields);
  });
}

Projects.add = function(body, call_back) {
  console.log("add called.");
  this.db.query("INSERT into projects (name, description, source_code_url, development_server_url, production_server_url) values (?,?,?,?,?);", [body.name, body.description, body.source_code_url, body.development_server_url, body.production_server_url], function(err, results, fields) {
    if(err) {
      console.log(err);
    }
    call_back(err, results, fields);
  });
}

Projects.update = function(id, body, call_back) {
  console.log("update called");

  var updateStringArray = [];
  var updateValuesArray = [];

  for (var property in body) {
      if (body.hasOwnProperty(property)) {
        updateStringArray.push(property + " = ?");
        updateValuesArray.push(body[property]);
      }
  }

  updateValuesArray.push(id);

  console.log(updateStringArray.join(", "));
  console.log(updateValuesArray.join(", "));

  this.db.query("UPDATE projects SET " + updateStringArray.join(", ") + " WHERE id = ?;", updateValuesArray, function(err, results, fields) {
    call_back(err, results, fields);
  });  
}

Projects.delete = function(id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from projects WHERE id = ?;", [id], function(err, results, fields) {
    call_back(err, results, fields);
  });    
}

module.exports = Projects;