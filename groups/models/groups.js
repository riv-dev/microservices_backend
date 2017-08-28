var mysql = require('mysql')
var credentials = require('../credentials.js');

//The Groups model class
var Groups = function (id, lastname, firstname, title) {

}

var db_name = {
  development: "ryukyu_social_groups_service_dev",
  test: "ryukyu_social_groups_service_test",
  production: "ryukyu_social_groups_service"
}

//Static Methods and Variables
Groups.db = "Yo!";

Groups.schema = {
  name: {type: "varchar(255)", required: true}
}

Groups.connect = function (env) {
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

  Groups.initialize_db(env);
}

Groups.disconnect = function () {
  this.db.end()
}

Groups.initialize_db = function(env, call_back) {
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

  this.db.query('CREATE TABLE IF NOT EXISTS groups (id int NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE(name), PRIMARY KEY(id));', function(err) {
    if(err) {
      console.log(err);
    } 
  });

}

Groups.count_all = function (query, call_back) {
  console.log("count_all called.");

  var queryStringArray = [];
  var queryValuesArray = [];

  if(query) {
    for (var property in query) {
        if (Groups.schema.hasOwnProperty(property) && query.hasOwnProperty(property) && query[property] && query[property] != null) {
          queryStringArray.push(property + " = ?");
          queryValuesArray.push(query[property]);
        } else {
          console.log("Try to access unknown property: " + property);
        }
    }
  }

  if(queryStringArray.length > 0) {
    this.db.query('SELECT count(id) as num_rows FROM groups WHERE ' + queryStringArray.join(" AND ") + ';', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT count(id) as num_rows FROM groups;', function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

Groups.find_all = function (query, call_back) {
  console.log("find_all called.");
  
  var queryStringArray = [];
  var queryValuesArray = [];

  if(query) {
    for (var property in query) {
      if (Projects.schema.hasOwnProperty(property) && query.hasOwnProperty(property) && query[property] && query[property] != null) {
        queryStringArray.push(property + " = ?");
        queryValuesArray.push(query[property]);
      } else {
        console.log("Try to access unknown property: " + property);
      }
    }
  }

  //Pagination
  var limitStr = "";

  if (query && query.limit && parseInt(query.limit) > 0 && query.page && parseInt(query.page) > 1) {
    limitStr = " LIMIT " + (parseInt(query.page) - 1) * parseInt(query.limit) + "," + query.limit;
  } else if(query && query.limit && parseInt(query.limit) > 0) {
    limitStr = " LIMIT " + query.limit;
  }

  if (queryStringArray.length > 0) {
    this.db.query('SELECT * FROM groups WHERE ' + queryStringArray.join(" AND ") + limitStr + ';', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT * FROM groups ' + limitStr + ';', function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

Groups.find_by_id = function (id, call_back) {
  console.log("find_by_id called.");

  this.db.query("SELECT * FROM groups WHERE id = ? LIMIT 1;", [id], function (err, results, fields) {
    call_back(err, results, fields);
  });
}

Groups.add = function(body, call_back) {
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

  this.db.query("INSERT into groups (" + addStringArray.join(", ") +") values ("+ addMarksArray.join(",")+");", addValuesArray, function(err, results, fields) {
    if(err) {
      console.log(err);
    }
    call_back(err, results, fields);
  });
}


Groups.update = function(id, body, call_back) {
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

  this.db.query("UPDATE groups SET " + updateStringArray.join(", ") + " WHERE id = ?;", updateValuesArray, function(err, results, fields) {
    call_back(err, results, fields);
  });  
}

Groups.delete = function(id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from groups WHERE id = ?;", [id], function(err, results, fields) {
    call_back(err, results, fields);
  });    
}

module.exports = Groups;