var mysql = require('mysql')
var credentials = require('../credentials.js');

//The ProjectPhotos model class
var ProjectPhotos = function (id, name, title) {

}

var db_name = {
  development: "ryukyu_social_project_photos_service_dev",
  test: "ryukyu_social_project_photos_service_test",
  production: "ryukyu_social_project_photos_service"
}

//Static Methods and Variables
ProjectPhotos.db = "Yo!";

ProjectPhotos.connect = function (env) {
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

  ProjectPhotos.initialize_db(env);
}

ProjectPhotos.disconnect = function () {
  this.db.end()
}

ProjectPhotos.initialize_db = function(env, call_back) {
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

  this.db.query('CREATE TABLE IF NOT EXISTS project_photos (id int NOT NULL AUTO_INCREMENT, project_id int NOT NULL, name varchar(255), caption varchar(255), filepath varchar(255), mimetype varchar(30), PRIMARY KEY(id));', function(err) {
    if(err) {
      console.log(err);
    } 
  });

}

ProjectPhotos.find_by_project_id = function (id, call_back) {
  console.log("find_by_project_id called.");
  this.db.query("SELECT * FROM project_photos WHERE project_id='"+id+"' LIMIT 1;", function (err, rows, fields) {
    call_back(err, rows, fields);
  });
}

ProjectPhotos.add = function(body, call_back) {
  console.log("add called.");
  //Only allow one photo
  this.db.query("INSERT into project_photos (project_id, name, caption, filepath, mimetype) values (?,?,?,?,?);", [body.project_id, body.name, body.caption, body.filepath, body.mimetype], function(err, rows, fields) {
    if(err) {
      console.log(err);
    }

    call_back(err, rows, fields);
  });
}

ProjectPhotos.update = function(project_id, body, call_back) {
  console.log("update called");

  var updateStringArray = [];
  var updateValuesArray = [];

  for (var property in body) {
    if (body.hasOwnProperty(property) && body[property] != null) {
      updateStringArray.push(property + " = ?");
      updateValuesArray.push(body[property]);
    }
  }

  updateValuesArray.push(project_id);

  console.log(updateStringArray.join(", "));
  console.log(updateValuesArray.join(", "));
  console.log("UPDATE project_photos SET " + updateStringArray.join(", ") + " WHERE project_id = ?;");

  this.db.query("UPDATE project_photos SET " + updateStringArray.join(", ") + " WHERE project_id = ?;", updateValuesArray, function(err, rows, fields) {
    call_back(err, rows, fields);
  });  
}

ProjectPhotos.delete = function(project_id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from project_photos WHERE project_id = ?;", [project_id], function(err, rows, fields) {
    call_back(err, rows, fields);
  });    
}

module.exports = ProjectPhotos;