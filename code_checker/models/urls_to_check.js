var mysql = require('mysql')
var credentials = require('../credentials.js');

//The URLsToCheck model class
var URLsToCheck = function (id, lastname, firstname, title) {

}

var db_name = {
  development: "ryukyu_social_code_checker_projects_service_dev",
  test: "ryukyu_social_code_checker_projects_service_test",
  production: "ryukyu_social_code_checker_projects_service"
}

//Static Methods and Variables
URLsToCheck.db = "Yo!";

URLsToCheck.connect = function (env) {
  this.db = mysql.createConnection({
    host: credentials.mysql[env].host,
    user: credentials.mysql[env].username,
    password: credentials.mysql[env].password,
  });

  this.db.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
  });

  URLsToCheck.initialize_db(env);
}

URLsToCheck.disconnect = function () {
  this.db.end()
}

URLsToCheck.initialize_db = function(env, call_back) {
  console.log("create_db called.");

  this.db.query('CREATE DATABASE IF NOT EXISTS ' + db_name[env] + ';', function(err) {
    if(err) {
      console.log(err);
    }
  });

  this.db.query('USE ' + db_name[env] + ';', function(err) {
    if(err) {
      console.log(err);
    }
  });

  this.db.query('CREATE TABLE IF NOT EXISTS urls_to_check (id int NOT NULL AUTO_INCREMENT, project_id int NOT NULL, url varchar(512), UNIQUE (project_id, url), PRIMARY KEY(id), FOREIGN KEY (project_id) REFERENCES code_checker_projects(project_id) ON DELETE CASCADE);', function(err) {
    if(err) {
      console.log(err);
    } 
  });
}

URLsToCheck.find_all = function (query, call_back) {
  console.log("find_all called.");

  this.db.query('SELECT * FROM urls_to_check;', function(err, results, fields) {
    call_back(err, results, fields);
  });
}

URLsToCheck.find_all_by_project_id = function (project_id, call_back) {
  console.log("find_by_id called.");

  this.db.query("SELECT * FROM urls_to_check WHERE project_id = ?;", [project_id], function (err, results, fields) {
    call_back(err, results, fields);
  });
}

URLsToCheck.add = function(body, call_back) {
  console.log("add called.");

  var addStringArray = [];
  var addMarksArray = [];
  var addValuesArray = [];

  for (var property in body) {
      if (body.hasOwnProperty(property) && body[property] != null) {
        addStringArray.push(property);
        addMarksArray.push("?");
        addValuesArray.push(body[property]);
      }
  }

  this.db.query("INSERT into urls_to_check (" + addStringArray.join(", ") +") values ("+ addMarksArray.join(",")+");", addValuesArray, function(err, results, fields) {
    if(err) {
      console.log(err);
    }
    call_back(err, results, fields);
  });
}


URLsToCheck.update = function(id, body, call_back) {
  console.log("update called");

  var updateStringArray = [];
  var updateValuesArray = [];

  for (var property in body) {
      if (body.hasOwnProperty(property) && body[property] != null) {
        updateStringArray.push(property + " = ?");
        updateValuesArray.push(body[property]);
      }
  }

  updateValuesArray.push(id);

  console.log(updateStringArray.join(", "));
  console.log(updateValuesArray.join(", "));

  this.db.query("UPDATE urls_to_check SET " + updateStringArray.join(", ") + " WHERE project_id = ?;", updateValuesArray, function(err, results, fields) {
    call_back(err, results, fields);
  });  
}

URLsToCheck.delete = function(id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from urls_to_check WHERE id = ?;", [id], function(err, results, fields) {
    call_back(err, results, fields);
  });    
}

URLsToCheck.delete_all = function(project_id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from urls_to_check WHERE project_id = ?;", [project_id], function(err, results, fields) {
    call_back(err, results, fields);
  });
}

module.exports = URLsToCheck;