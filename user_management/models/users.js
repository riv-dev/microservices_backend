var mysql = require('mysql')
var credentials = require('../credentials.js');
var bcrypt = require('bcrypt-nodejs'); //for password hashing

//The Users model class
var Users = function (id, lastname, firstname, title) {

}

//Static Methods and Variables
Users.db = "Yo!";

Users.connect = function () {
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

  Users.initialize_db();
}

Users.disconnect = function () {
  this.db.end()
}

Users.initialize_db = function(call_back) {
  console.log("create_db called.");

  this.db.query('CREATE DATABASE IF NOT EXISTS ryukyu_social_users_service;', function(err) {
    if(err) {
      console.log(err);
    }
  });

  this.db.query('USE ryukyu_social_users_service;', function(err) {
    if(err) {
      console.log(err);
    }
  });

  this.db.query('CREATE TABLE IF NOT EXISTS users (id int NOT NULL AUTO_INCREMENT, lastname varchar(255) NOT NULL, firstname varchar(255) NOT NULL, title varchar(255), email varchar(255), hashed_password char(60), admin boolean DEFAULT FALSE, PRIMARY KEY(id));', function(err) {
    if(err) {
      console.log(err);
    } 
  });

  Users.create_default_user();
}

Users.create_default_user = function() {
  Users.find_all(function(err, rows, fields) {
    if(err) {
      console.log(err);
      return;
    }

    if(rows && rows.length == 0) {
      Users.add({firstname:'Root', lastname:'Admin', title:'Default User', email:'admin@admin.com', hashed_password:bcrypt.hashSync("password"), admin:1}, function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });
    }
  });
}

Users.find_all = function (call_back) {
  console.log("find_all called.");

  this.db.query('SELECT id,lastname,firstname,title,email,admin FROM users ORDER BY lastname;', function (err, rows, fields) {
    call_back(err, rows, fields);
  });
}

Users.find_by_id = function (id, call_back) {
  console.log("find_by_id called.");

  this.db.query("SELECT id,lastname,firstname,title,email,admin FROM users WHERE id='"+id+"' LIMIT 1;", function (err, rows, fields) {
    call_back(err, rows, fields);
  });
}

Users.find_by_email = function(email, call_back) {
  console.log("find_by_email called.");

  this.db.query("SELECT * FROM users WHERE email='"+email+"' LIMIT 1;", function (err, rows, fields) {
    call_back(err, rows, fields);
  });  
}

Users.add = function(body, call_back) { //lastname, firstname, title, email, hashed_password, admin, call_back) {
  console.log("add called.");
  this.db.query("INSERT into users (lastname, firstname, title, email, hashed_password, admin) values (?,?,?,?,?,?);", [body.lastname, body.firstname, body.title, body.email, body.hashed_password, body.admin], function(err, rows, fields) {
    if(err) {
      console.log(err);
    }
    call_back(err, rows, fields);
  });
}

Users.update = function(id, body, call_back) {
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

  this.db.query("UPDATE users SET " + updateStringArray.join(", ") + " WHERE id = ?;", updateValuesArray, function(err, rows, fields) {
    call_back(err, rows, fields);
  });  
}

Users.delete = function(id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from users WHERE id = ?;", [id], function(err, rows, fields) {
    call_back(err, rows, fields);
  });    
}

module.exports = Users;