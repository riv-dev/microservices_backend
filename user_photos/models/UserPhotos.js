var mysql = require('mysql')
var credentials = require('../credentials.js');

//The UserPhotos model class
var UserPhotos = function (id, lastname, firstname, title) {

}

var db_name = {
  development: "ryukyu_social_user_photos_service_dev",
  test: "ryukyu_social_user_photos_service_test",
  production: "ryukyu_social_user_photos_service"
}

//Static Methods and Variables
UserPhotos.db = "Yo!";

UserPhotos.connect = function (env) {
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

  UserPhotos.initialize_db(env);
}

UserPhotos.disconnect = function () {
  this.db.end()
}

UserPhotos.initialize_db = function(env, call_back) {
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

  this.db.query('CREATE TABLE IF NOT EXISTS user_photos (id int NOT NULL AUTO_INCREMENT, user_id int NOT NULL, lastname varchar(255), firstname varchar(255), caption varchar(255), filepath varchar(255), mimetype varchar(30), updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY(id));', function(err) {
    if(err) {
      console.log(err);
    } 
  });

}

UserPhotos.find_by_user_id = function (id, call_back) {
  console.log("find_by_user_id called.");
  this.db.query("SELECT * FROM user_photos WHERE user_id='"+id+"' LIMIT 1;", function (err, rows, fields) {
    call_back(err, rows, fields);
  });
}

UserPhotos.add = function(body, call_back) {
  console.log("add called.");
  //Only allow one photo
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

  this.db.query("INSERT into user_photos (" + addStringArray.join(", ") +") values ("+ addMarksArray.join(",")+");", addValuesArray, function(err, results, fields) {
    if(err) {
      console.log(err);
    }
    call_back(err, results, fields);
  });
}

UserPhotos.update = function(user_id, body, call_back) {
  console.log("update called");

  var updateStringArray = [];
  var updateValuesArray = [];

  for (var property in body) {
      if (body.hasOwnProperty(property) && body[property] != null) {
        updateStringArray.push(property + " = ?");
        updateValuesArray.push(body[property]);
      }
  }

  updateValuesArray.push(user_id);

  console.log(updateStringArray.join(", "));
  console.log(updateValuesArray.join(", "));
  console.log("UPDATE user_photos SET " + updateStringArray.join(", ") + " WHERE user_id = ?;");

  this.db.query("UPDATE user_photos SET " + updateStringArray.join(", ") + " WHERE user_id = ?;", updateValuesArray, function(err, rows, fields) {
    call_back(err, rows, fields);
  });  
}

UserPhotos.delete = function(user_id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from user_photos WHERE user_id = ?;", [user_id], function(err, rows, fields) {
    call_back(err, rows, fields);
  });    
}

module.exports = UserPhotos;