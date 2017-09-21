var mysql = require('mysql')
var credentials = require('../credentials.js');

//The SASSFolders model class
var SASSFolders = function (id, lastname, firstname, title) {

}

var db_name = {
  development: "ryukyu_social_code_checker_projects_service_dev",
  test: "ryukyu_social_code_checker_projects_service_test",
  production: "ryukyu_social_code_checker_projects_service"
}

//Static Methods and Variables
SASSFolders.db = "Yo!";

SASSFolders.schema = {
  id: {type: "int"},
  project_id: {type: "int"},
  relative_path: {type: "varchar(255)"}
}

SASSFolders.connect = function (env) {
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

  SASSFolders.initialize_db(env);
}

SASSFolders.disconnect = function () {
  this.db.end()
}

SASSFolders.initialize_db = function(env, call_back) {
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

  this.db.query('CREATE TABLE IF NOT EXISTS sass_folders (id int NOT NULL AUTO_INCREMENT, project_id int NOT NULL, relative_path varchar(255), UNIQUE (project_id, relative_path), PRIMARY KEY(id), FOREIGN KEY (project_id) REFERENCES code_checker_projects(project_id) ON DELETE CASCADE);', function(err) {
    if(err) {
      console.log(err);
    } 
  });
}

SASSFolders.find_all = function (query, call_back) {
  console.log("find_all called.");

  this.db.query('SELECT * FROM sass_folders;', function(err, results, fields) {
    call_back(err, results, fields);
  });
}

SASSFolders.find_all_by_project_id = function (project_id, call_back) {
  console.log("find_by_id called.");

  this.db.query("SELECT * FROM sass_folders WHERE project_id = ?;", [project_id], function (err, results, fields) {
    call_back(err, results, fields);
  });
}

SASSFolders.add = function(body, call_back) {
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

  this.db.query("INSERT into sass_folders (" + addStringArray.join(", ") +") values ("+ addMarksArray.join(",")+");", addValuesArray, function(err, results, fields) {
    if(err) {
      console.log(err);
    }
    call_back(err, results, fields);
  });
}


SASSFolders.update = function(id, body, call_back) {
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

  this.db.query("UPDATE sass_folders SET " + updateStringArray.join(", ") + " WHERE project_id = ?;", updateValuesArray, function(err, results, fields) {
    call_back(err, results, fields);
  });  
}

SASSFolders.delete = function(id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from sass_folders WHERE id = ?;", [id], function(err, results, fields) {
    call_back(err, results, fields);
  });    
}

SASSFolders.delete_all = function(project_id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from sass_folders WHERE project_id = ?;", [project_id], function(err, results, fields) {
    call_back(err, results, fields);
  });
}

module.exports = SASSFolders;