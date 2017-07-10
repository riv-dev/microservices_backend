var mysql = require('mysql')
var credentials = require('../credentials.js');

//The Projects model class
var Projects = function (id, lastname, firstname, title) {

}

//Static Methods and Variables
Projects.db = "Yo!";

Projects.schema = {
  name: {type: "varchar(255)", required: true},
  description: {type: "text", required: false},
  value: {type: "int", required: false},
  effort: {type: "int", required: false},
  status: {type: "varchar(255)", required: false, default: "new", options: ["new", "doing", "finished"]},
  start_date: {type: "datetime", required: false},
  deadline: {type: "datetime", required: false}
}

Projects.connect = function () {
  this.db = mysql.createConnection({
    host: credentials.mysql.host,
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

  this.db.query('CREATE TABLE IF NOT EXISTS projects (id int NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL, description text, value int, effort int, status varchar(255) DEFAULT "new", start_date datetime, deadline datetime,  PRIMARY KEY(id));', function(err) {
    if(err) {
      console.log(err);
    } 
  });

  Projects.create_default_projects();
}

Projects.create_default_projects = function() {
  Projects.find_all(function(err, rows, fields) {
    if(err) {
      console.log(err);
      return;
    }

    if(rows && rows.length == 0) {
      Projects.add({name:'Project 1', description:'Example project 1 description.', value:'1000', effort: '700'}, function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });

      Projects.add({name:'Project 2', description:'Example project 2 description.', value:'2000', effort: '100'}, function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });

      Projects.add({name:'Project 3', description:'Example project 3 description.', value:'800', effort: '600'}, function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });
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

  var addStringArray = [];
  var addMarksArray = [];
  var addValuesArray = [];

  for (var property in body) {
      if (body.hasOwnProperty(property) && body[property] && body[property] != null) {
        addStringArray.push(property);
        addMarksArray.push("?");
        addValuesArray.push(body[property]);
      }
  }

  this.db.query("INSERT into projects (" + addStringArray.join(", ") +") values ("+ addMarksArray.join(",")+");", addValuesArray, function(err, results, fields) {
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
      if (body.hasOwnProperty(property) && body[property] && body[property] != null) {
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