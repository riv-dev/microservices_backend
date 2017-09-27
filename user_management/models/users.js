var mysql = require('mysql')
var credentials = require('../credentials.js');
var bcrypt = require('bcrypt-nodejs'); //for password hashing

//The Users model class
var Users = function (id, lastname, firstname, title) {

}

var db_name = {
  development: "ryukyu_social_users_service_dev",
  test: "ryukyu_social_users_service_test",
  production: "ryukyu_social_users_service"
}

//Static Methods and Variables
Users.db = "Yo!";

Users.schema = {
  id: {type: "int"},
  lastname: {type: "varchar(255)"},
  firstname: {type: "varchar(255)"},
  title: {type: "varchar(255)"},
  email: {type: "varchar(255)"},
  hashed_password: {type: "char(60)"},
  admin: {type: "boolean"},
  active: {type: "boolean"}
}

Users.connect = function (env) {
  this.db = mysql.createConnection({
    host: credentials.mysql[env].host,
    user: credentials.mysql[env].username,
    password: credentials.mysql[env].password
  });

  this.db.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
  });

  Users.initialize_db(env);
}

Users.disconnect = function () {
  this.db.end()
}

Users.initialize_db = function(env, call_back) {
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

  this.db.query('CREATE TABLE IF NOT EXISTS users (id int NOT NULL AUTO_INCREMENT, lastname varchar(255) NOT NULL, firstname varchar(255) NOT NULL, title varchar(255), email varchar(255), hashed_password char(60), admin boolean DEFAULT FALSE, active boolean DEFAULT true, UNIQUE(email), PRIMARY KEY(id));', function(err) {
    if(err) {
      console.log(err);
    } 
  });

  Users.create_default_user();
}

Users.create_default_user = function() {
  Users.find_all(null, function(err, rows, fields) {
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

Users.find_all = function (query, call_back) {
  console.log("find_all called.");

  var queryStringArray = [];
  var queryValuesArray = [];

  if(query) {
    for (var property in query) {
        if (Users.schema.hasOwnProperty(property) && property != "hashed_password" && query.hasOwnProperty(property) && query[property] && query[property] != null) {
          queryStringArray.push(property + " = ?");
          queryValuesArray.push(query[property]);
        } else {
          console.log("Try to access unknown property: " + property);
        }
    }
  }

  if(queryStringArray.length > 0) {
    this.db.query('SELECT id,lastname,firstname,title,email,admin,active FROM users WHERE ' + queryStringArray.join(" AND ") + ' ORDER BY lastname;', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT id,lastname,firstname,title,email,admin,active FROM users ORDER BY lastname;', function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

Users.find_all_by_ids = function(ids, call_back) {
  console.log("find_all_by_id called: " + ids);

  this.db.query('SELECT id,lastname,firstname,title,email,admin,active FROM users WHERE id IN (?);', ids, function (err, rows, fields) {

    call_back(err, rows, fields);
  });
}

Users.find_by_id = function (id, call_back) {
  console.log("find_by_id called.");

  this.db.query("SELECT id,lastname,firstname,title,email,admin,active FROM users WHERE id='"+id+"' LIMIT 1;", function (err, rows, fields) {
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
  
    var addStringArray = [];
    var addMarksArray = [];
    var addValuesArray = [];
  
    for (var property in body) {
        if (Users.schema.hasOwnProperty(property) && body.hasOwnProperty(property) && body[property] != null) {
          addStringArray.push(property);
          addMarksArray.push("?");
          addValuesArray.push(body[property]);
        }
    }
  
    this.db.query("INSERT into users (" + addStringArray.join(", ") +") values ("+ addMarksArray.join(",")+");", addValuesArray, function(err, results, fields) {
      if(err) {
        console.log(err);
      }
      call_back(err, results, fields);
    });
}

Users.update = function(id, body, call_back) {
  console.log("update called");

  var updateStringArray = [];
  var updateValuesArray = [];

  for (var property in body) {
      if (Users.schema.hasOwnProperty(property) && body.hasOwnProperty(property) && body[property] != null) {
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