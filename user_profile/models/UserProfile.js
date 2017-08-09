var mysql = require('mysql')
var credentials = require('../credentials.js');
var UserProfile = function (user_id, nickname, bio, birthday) {

}

var db_name = {
  development: "ryukyu_social_user_profile_service_dev",
  test: "ryukyu_social_user_profile_service_test",
  production: "ryukyu_social_user_profile_service"
}

//Static Methods and Variables
UserProfile.db = "Yo!";

UserProfile.connect = function (env) {
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

    UserProfile.initialize_db(env);
}

UserProfile.disconnect = function () {
  this.db.end()
}

UserProfile.initialize_db = function(env, call_back) {
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

  this.db.query('CREATE TABLE IF NOT EXISTS user_profile (id int NOT NULL AUTO_INCREMENT, user_id int NOT NULL, nickname varchar(255), bio varchar(255), birthday DATE, PRIMARY KEY(id), UNIQUE (user_id));', function(err) {
    if(err) {
      console.log(err);
    } 
  });

}

UserProfile.find_by_user_id = function (id, call_back) {
  console.log("find_by_user_id called.");
  this.db.query("SELECT * FROM user_profile WHERE user_id='"+id+"' LIMIT 1;", function (err, rows, fields) {
    call_back(err, rows, fields);
  });
}

UserProfile.add = function(body, call_back) {
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

  this.db.query("INSERT into user_profile (" + addStringArray.join(", ") +") values ("+ addMarksArray.join(",")+");", addValuesArray, function(err, results, fields) {
    if(err) {
      console.log(err);
    }
    call_back(err, results, fields);
  });
}

UserProfile.update = function(user_id, body, call_back) {
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

  this.db.query("UPDATE user_profile SET " + updateStringArray.join(", ") + " WHERE user_id = ?;", updateValuesArray, function(err, results, fields) {
    call_back(err, results, fields);
  });  
}

UserProfile.delete = function(user_id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from user_profile WHERE user_id = ?;", [user_id], function(err, rows, fields) {
    call_back(err, rows, fields);
  });    
}

module.exports = UserProfile;