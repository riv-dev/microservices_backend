var mysql = require('mysql')
var credentials = require('../credentials.js');

//The ResultMessages model class
var ResultMessages = function (id, lastname, firstname, title) {

}

var db_name = {
  development: "ryukyu_social_code_checker_projects_service_dev",
  test: "ryukyu_social_code_checker_projects_service_test",
  production: "ryukyu_social_code_checker_projects_service"
}

//Static Methods and Variables
ResultMessages.db = "Yo!";

ResultMessages.connect = function (env) {
  this.db = mysql.createConnection({
    host: credentials.mysql[env].host,
    user: credentials.mysql[env].username,
    password: credentials.mysql[env].password,
    multipleStatements: true
  });

  this.db.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
  });

  ResultMessages.initialize_db(env);
}

ResultMessages.disconnect = function () {
  this.db.end()
}

ResultMessages.initialize_db = function(env, call_back) {
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

  this.db.query('CREATE TABLE IF NOT EXISTS result_messages (id int NOT NULL AUTO_INCREMENT, project_id int NOT NULL, msg_type varchar(32), msg_level varchar(32), msg varchar(255), line_num int, source text, PRIMARY KEY(id), FOREIGN KEY (project_id) REFERENCES code_checker_projects(project_id) ON DELETE CASCADE);', function(err) {
    if(err) {
      console.log(err);
    } 
  });
}

ResultMessages.count_all = function(query, call_back) {
  console.log("count_all called.");

  var queryStringArray = [];
  var queryValuesArray = [];

  if(query) {
    for (var property in query) {
        if (query.hasOwnProperty(property) && query[property] && query[property] != null) {
          queryStringArray.push(property + " = ?");
          queryValuesArray.push(query[property]);
        } 
    }
  }

  if(queryStringArray.length > 0) {
    this.db.query('SELECT count(id) as num_rows FROM result_messages WHERE ' + queryStringArray.join(" AND ") + ';', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT count(id) as num_rows FROM result_messages;', function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

ResultMessages.find_all = function (query, call_back) {
  console.log("find_all called.");

  var queryStringArray = [];
  var queryValuesArray = [];

  if(query) {
    for (var property in query) {
        if (property != "limit" && property != "page" && query.hasOwnProperty(property) && query[property] && query[property] != null) {
          queryStringArray.push(property + " = ?");
          queryValuesArray.push(query[property]);
        }
    }
  }

  //Pagination
  var limitStr = "";
  
    if(query && query.limit && parseInt(query.limit) > 0 && query.page && parseInt(query.page) > 1) {
      limitStr = " LIMIT " + (parseInt(query.page)-1)*parseInt(query.limit) + "," + query.limit;
    }
    else if(query && query.limit && parseInt(query.limit) > 0) {
      limitStr = " LIMIT " + query.limit;
    }

  if (queryStringArray.length > 0) {
    this.db.query('SELECT * FROM result_messages WHERE ' + queryStringArray.join(" AND ") + limitStr + ';', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT * FROM result_messages' + limitStr + ';', function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

ResultMessages.add = function(body, call_back) {
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

  this.db.query("INSERT into result_messages (" + addStringArray.join(", ") +") values ("+ addMarksArray.join(",")+");", addValuesArray, function(err, results, fields) {
    if(err) {
      console.log(err);
    }
    call_back(err, results, fields);
  });
}

//Do a bulk query for better efficieny
ResultMessages.bulk_add = function(body_arr, call_back) {
  var bulk_query = ""; 
  var addValuesArray = [];

  for (var i = 0; i < body_arr.length; i++) {
    var addStringArray = [];
    var addMarksArray = [];

    for (var property in body_arr[i]) {
      if (body_arr[i].hasOwnProperty(property) && body_arr[i][property] != null) {
        addStringArray.push(property);
        addMarksArray.push("?");
        addValuesArray.push(body_arr[i][property]);
      }
    }
    var current_query = "INSERT into result_messages (" + addStringArray.join(", ") +") values ("+ addMarksArray.join(",")+");"
    bulk_query = bulk_query + current_query;
  }

  this.db.query(bulk_query, addValuesArray, function(err, results, fields) {
    if(err) {
      console.log(err);
    }
    call_back(err, results, fields);
  });
}

ResultMessages.update = function(id, body, call_back) {
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

  this.db.query("UPDATE result_messages SET " + updateStringArray.join(", ") + " WHERE project_id = ?;", updateValuesArray, function(err, results, fields) {
    call_back(err, results, fields);
  });  
}

ResultMessages.delete = function(id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from result_messages WHERE id = ?;", [id], function(err, results, fields) {
    call_back(err, results, fields);
  });    
}

ResultMessages.delete_all = function(project_id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from result_messages WHERE project_id = ?;", [project_id], function(err, results, fields) {
    call_back(err, results, fields);
  });
}

module.exports = ResultMessages;