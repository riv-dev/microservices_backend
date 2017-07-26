var mysql = require('mysql')
var credentials = require('../credentials.js');

//The Projects model class
var Projects = function (id, lastname, firstname, title) {

}

//Static Methods and Variables
Projects.db = "Yo!";

Projects.schema = {
  name: {type: "varchar(255)", required: true},
  description: {type: "text", required: false},
  value: {type: "int", required: false},
  effort: {type: "int", required: false},
  status: {type: "varchar(255)", required: false, default: "new", options: ["new", "doing", "finished"]},
  start_date: {type: "datetime", required: false},
  deadline: {type: "datetime", required: false}
}

Projects.connect = function (env) {
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

  Projects.initialize_db();
}

Projects.disconnect = function () {
  this.db.end()
}

Projects.initialize_db = function(call_back) {
  console.log("create_db called.");

  this.db.query('CREATE DATABASE IF NOT EXISTS ryukyu_social_projects_service;', function(err) {
    if(err) {
      console.log(err);
    }
  });

  this.db.query('USE ryukyu_social_projects_service;', function(err) {
    if(err) {
      console.log(err);
    }
  });

  this.db.query('CREATE TABLE IF NOT EXISTS projects (id int NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL, description text, value int, effort int, status varchar(255) DEFAULT "new", start_date datetime, deadline datetime, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY(id));', function(err) {
    if(err) {
      console.log(err);
    } 
  });

}

Projects.count_all = function (query, call_back) {
  console.log("count_all called.");

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

  if(queryStringArray.length > 0) {
    this.db.query('SELECT count(id) as num_rows FROM projects WHERE ' + queryStringArray.join(" AND ") + ';', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT count(id) as num_rows FROM projects;', function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

Projects.find_all = function (query, call_back) {
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

  //Project Ranking
  var orderByClause = ' ORDER BY -deadline DESC, -value ASC, -start_date DESC, LENGTH(status) ASC, id DESC';

  //Pagination
  var limitStr = "";

  if(query && query.limit && parseInt(query.limit) > 0 && query.page && parseInt(query.page) > 1) {
    limitStr = " LIMIT " + (parseInt(query.page)-1)*parseInt(query.limit) + "," + query.limit;
  }
  else if(query && query.limit && parseInt(query.limit) > 0) {
    limitStr = " LIMIT " + query.limit;
  }

  if(queryStringArray.length > 0) {
    this.db.query('SELECT *,status AS project_status FROM projects WHERE ' + queryStringArray.join(" AND ") + orderByClause + limitStr + ';', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT *,status AS project_status FROM projects' + orderByClause + limitStr + ';', function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

Projects.count_all_by_user_id = function(query, user_id, call_back) {
  console.log("count_all_by_user_id called.");

  var queryStringArray = [];
  var queryValuesArray = [];

  if(query) {
    for (var property in query) {
        if (Projects.schema.hasOwnProperty(property) && query.hasOwnProperty(property) && query[property] && query[property] != null) {
          queryStringArray.push("projects." + property + " = ?");
          queryValuesArray.push(query[property]);
        } else {
          console.log("Try to access unknown property: " + property);
        }
    }
  }

  queryValuesArray.push(user_id);

  if(queryStringArray.length > 0) {  
    this.db.query('SELECT count(projects.id) as num_rows FROM projects INNER JOIN project_users ON projects.id = project_users.project_id WHERE '+ queryStringArray.join(" AND ") + ' AND project_users.user_id = ?;', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT count(projects.id) as num_rows FROM projects INNER JOIN project_users ON projects.id = project_users.project_id WHERE project_users.user_id = ?;', [user_id], function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

Projects.find_all_by_user_id = function(query, user_id, call_back) {
  console.log("find_all_by_user_id called.");

  var queryStringArray = [];
  var queryValuesArray = [];

  if(query) {
    for (var property in query) {
        if (Projects.schema.hasOwnProperty(property) && query.hasOwnProperty(property) && query[property] && query[property] != null) {
          queryStringArray.push("projects." + property + " = ?");
          queryValuesArray.push(query[property]);
        } else {
          console.log("Try to access unknown property: " + property);
        }
    }
  }

  queryValuesArray.push(user_id);

  //Project Ranking
  var orderByClause = ' ORDER BY -projects.deadline DESC, -projects.value ASC, -projects.start_date DESC, LENGTH(projects.status) ASC, projects.id DESC';

  //Pagination
  var limitStr = "";

  if(query && query.limit && parseInt(query.limit) > 0 && query.page && parseInt(query.page) > 1) {
    limitStr = " LIMIT " + (parseInt(query.page)-1)*parseInt(query.limit) + "," + query.limit;
  }
  else if(query && query.limit && parseInt(query.limit) > 0) {
    limitStr = " LIMIT " + query.limit;
  }

  if(queryStringArray.length > 0) {  
    this.db.query('SELECT *,projects.status AS project_status,project_users.status AS user_status FROM projects INNER JOIN project_users ON projects.id = project_users.project_id WHERE '+ queryStringArray.join(" AND ") + ' AND project_users.user_id = ?' + orderByClause + limitStr + ';', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT *,projects.status AS project_status,project_users.status AS user_status FROM projects INNER JOIN project_users ON projects.id = project_users.project_id WHERE project_users.user_id = ?' + orderByClause + limitStr + ';', [user_id], function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

Projects.find_by_id = function (id, call_back) {
  console.log("find_by_id called.");

  this.db.query("SELECT * FROM projects WHERE id = ? LIMIT 1;", [id], function (err, results, fields) {
    call_back(err, results, fields);
  });
}

Projects.add = function(body, call_back) {
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

  this.db.query("INSERT into projects (" + addStringArray.join(", ") +") values ("+ addMarksArray.join(",")+");", addValuesArray, function(err, results, fields) {
    if(err) {
      console.log(err);
    }
    call_back(err, results, fields);
  });
}


Projects.update = function(id, body, call_back) {
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

  this.db.query("UPDATE projects SET " + updateStringArray.join(", ") + " WHERE id = ?;", updateValuesArray, function(err, results, fields) {
    call_back(err, results, fields);
  });  
}

Projects.delete = function(id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from projects WHERE id = ?;", [id], function(err, results, fields) {
    call_back(err, results, fields);
  });    
}

module.exports = Projects;