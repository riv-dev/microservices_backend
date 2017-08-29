var mysql = require('mysql')
var credentials = require('../credentials.js');

//The Files model class
var Files = function (id, name, title) {

}

var db_name = {
  development: "ryukyu_social_files_service_dev",
  test: "ryukyu_social_files_service_test",
  production: "ryukyu_social_files_service"
}

//Static Methods and Variables
Files.db = "Yo!";

Files.connect = function (env) {
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

  Files.initialize_db(env);
}

Files.disconnect = function () {
  this.db.end()
}

Files.initialize_db = function(env, call_back) {
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

  this.db.query('CREATE TABLE IF NOT EXISTS files (id int NOT NULL AUTO_INCREMENT, parent_id int NOT NULL, category varchar(20) NOT NULL, original_file_name varchar(255), filepath varchar(255), mimetype varchar(180), updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY(id));', function(err) {
    if(err) {
      console.log(err);
    } 
  });

}

Files.find_by_id = function (id, call_back) {
  console.log("find_by_id called.");
  this.db.query("SELECT * FROM files WHERE id='" + id + "' LIMIT 1;", function (err, rows, fields) {
    call_back(err, rows, fields);
  });
}

Files.find_all_by_parent_id = function (id, category, call_back) {
  console.log("find_all_by_parent_id called.");
  this.db.query("SELECT * FROM files WHERE parent_id='" + id + "' AND category='" + category + "';", function (err, rows, fields) {
    call_back(err, rows, fields);
  });
}

Files.add = function(body, call_back) {
  console.log("add called.");
  //Only allow one file
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

  this.db.query("INSERT into files (" + addStringArray.join(", ") + ") values (" + addMarksArray.join(",") + ");", addValuesArray, function(err, results, fields) {
    if(err) {
      console.log(err);
    }
    call_back(err, results, fields);
  });
}

Files.update = function(id, body, call_back) {
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
  console.log("UPDATE files SET " + updateStringArray.join(", ") + " WHERE id = ?;");

  this.db.query("UPDATE files SET " + updateStringArray.join(", ") + " WHERE id = ?;", updateValuesArray, function(err, rows, fields) {
    call_back(err, rows, fields);
  });  
}

Files.delete_all = function(parent_id, category, call_back) {
  console.log("delete all called");

  this.db.query("DELETE from files WHERE parent_id = ? AND category = ?;", [parent_id, category], function(err, rows, fields) {
    call_back(err, rows, fields);
  });    
}

Files.delete = function(id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from files WHERE id = ?;", [id], function(err, rows, fields) {
    call_back(err, rows, fields);
  });    
}

module.exports = Files;