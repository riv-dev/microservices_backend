var mysql = require('mysql')
var credentials = require('../credentials.js');

//The Tasks model class
var Tasks = function (id, lastname, firstname, title) {

}

var db_name = {
  development: "ryukyu_social_tasks_service_dev",
  test: "ryukyu_social_tasks_service_test",
  production: "ryukyu_social_tasks_service"
}

//Static Methods and Variables
Tasks.db = "Yo!";

//'name varchar(255) NOT NULL, description text, priority int, status varchar(255) DEFAULT "new", deadline datetime, project_id int, user_id int, PRIMARY KEY(id));'  
Tasks.schema = {
  name: {type: "varchar(255)", required: true},
  description: {type: "text", required: false},
  priority: {type: "int", required: false},
  status: {type: "varchar(255)", required: false, default: "dump", options: ["dump", "waiting", "doing", "finished"]},
  deadline: {type: "datetime", required: false},
  project_id: {type: "int", required: false, description: "Usually defined when POSTING a task to a URL /projects/:project_id/tasks. No need to edit"},
  creator_user_id: {type: "int", description: "Usually defined when creating a task, the creator of the task. No need to edit"},
  archived: {type: "boolean", description: "Flag to archive the task."},
  pinned: {type: "boolean", required: false, default: false},
  project_pinned: {type: "boolean", required: false, default: false}
}

Tasks.connect = function (env) {
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

  Tasks.initialize_db(env);
}

Tasks.disconnect = function () {
  this.db.end()
}

Tasks.initialize_db = function(env, call_back) {
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

  this.db.query('CREATE TABLE IF NOT EXISTS tasks (id int NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL, description text, priority int, status varchar(255) DEFAULT "dump", deadline datetime, project_id int, creator_user_id int, archived boolean DEFAULT FALSE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, pinned boolean DEFAULT FALSE, project_pinned boolean DEFAULT FALSE, PRIMARY KEY(id));', function(err) {
    if(err) {
      console.log(err);
    }
  });

}

Tasks.count_all = function(query, call_back) {
  console.log("count_all called.");

  var queryStringArray = [];
  var queryValuesArray = [];

  if(query) {
    for (var property in query) {
        if (Tasks.schema.hasOwnProperty(property) && query.hasOwnProperty(property) && query[property] && query[property] != null) {
          queryStringArray.push(property + " = ?");
          queryValuesArray.push(query[property]);
        } else {
          console.log("Try to access unknown property: " + property);
        }
    }
  }

  if(queryStringArray.length > 0) {
    this.db.query('SELECT count(id) as num_rows FROM tasks WHERE ' + queryStringArray.join(" AND ") + ';', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT count(id) as num_rows FROM tasks;', function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

Tasks.find_all = function (query, call_back) {
  console.log("find_all called.");

  var queryStringArray = [];
  var queryValuesArray = [];

  if(query) {
    for (var property in query) {
        if (Tasks.schema.hasOwnProperty(property) && query.hasOwnProperty(property) && query[property] && query[property] != null) {
          queryStringArray.push(property + " = ?");
          queryValuesArray.push(query[property]);
        } else {
          console.log("Try to access unknown property: " + property);
        }
    }
  }

  //Task Ranking
  var orderByClause =  " ORDER BY archived ASC, pinned DESC, CASE WHEN status!='finished' THEN -deadline END DESC, CASE WHEN status='finished' THEN deadline END DESC, -priority ASC, LENGTH(status) ASC, id DESC, updated_at DESC";

  if(query && query.project_id) {
    orderByClause =  " ORDER BY archived ASC, project_pinned DESC, CASE WHEN status!='finished' THEN -deadline END DESC, CASE WHEN status='finished' THEN deadline END DESC, -priority ASC, LENGTH(status) ASC, id DESC, updated_at DESC";
  }

  //Pagination
  var limitStr = "";

  if(query && query.limit && parseInt(query.limit) > 0 && query.page && parseInt(query.page) > 1) {
    limitStr = " LIMIT " + (parseInt(query.page)-1)*parseInt(query.limit) + "," + query.limit;
  }
  else if(query && query.limit && parseInt(query.limit) > 0) {
    limitStr = " LIMIT " + query.limit;
  }

  if(queryStringArray.length > 0) {
    this.db.query('SELECT * FROM tasks WHERE ' + queryStringArray.join(" AND ") + orderByClause + limitStr + ';', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT * FROM tasks ' + orderByClause + limitStr + ';', function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

Tasks.count_all_unassigned = function(query, call_back) {
  console.log("count_all_unassigned called.");

  var queryStringArray = [];
  var queryValuesArray = [];

  if(query) {
    for (var property in query) {
        if (Tasks.schema.hasOwnProperty(property) && query.hasOwnProperty(property) && query[property] && query[property] != null) {
          queryStringArray.push("tasks." + property + " = ?");
          queryValuesArray.push(query[property]);
        } else {
          console.log("Try to access unknown property: " + property);
        }
    }
  }

  if(queryStringArray.length > 0) {
    this.db.query('SELECT count(tasks.id) as num_rows FROM tasks LEFT JOIN task_assignments ON tasks.id = task_assignments.task_id WHERE task_assignments.task_id IS NULL AND ' + queryStringArray.join(" AND ") + ';', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT count(tasks.id) as num_rows FROM tasks LEFT JOIN task_assignments ON tasks.id = task_assignments.task_id WHERE task_assignments.task_id IS NULL;', function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

Tasks.find_all_unassigned = function (query, call_back) {
  console.log("find_all called.");

  var queryStringArray = [];
  var queryValuesArray = [];

  if (query) {
    for (var property in query) {
      if (Tasks.schema.hasOwnProperty(property) && query.hasOwnProperty(property) && query[property] && query[property] != null) {
        queryStringArray.push("tasks." + property + " = ?");
        queryValuesArray.push(query[property]);
      } else {
        console.log("Try to access unknown property: " + property);
      }
    }
  }

  //Task Ranking
  var orderByClause = " ORDER BY tasks.archived ASC, tasks.pinned DESC, CASE WHEN tasks.status!='finished' THEN -tasks.deadline END DESC, CASE WHEN tasks.status='finished' THEN tasks.deadline END DESC, -tasks.priority ASC, LENGTH(tasks.status) ASC, tasks.id DESC, tasks.updated_at DESC";

  if (query && query.project_id) {
    orderByClause = " ORDER BY tasks.archived ASC, tasks.project_pinned DESC, CASE WHEN tasks.status!='finished' THEN -tasks.deadline END DESC, CASE WHEN tasks.status='finished' THEN tasks.deadline END DESC, -tasks.priority ASC, LENGTH(tasks.status) ASC, tasks.id DESC, tasks.updated_at DESC";
  }

  //Pagination
  var limitStr = "";

  if (query && query.limit && parseInt(query.limit) > 0 && query.page && parseInt(query.page) > 1) {
    limitStr = " LIMIT " + (parseInt(query.page) - 1) * parseInt(query.limit) + "," + query.limit;
  }
  else if (query && query.limit && parseInt(query.limit) > 0) {
    limitStr = " LIMIT " + query.limit;
  }

  if (queryStringArray.length > 0) {
    this.db.query('SELECT tasks.* FROM tasks LEFT JOIN task_assignments ON tasks.id = task_assignments.task_id WHERE task_assignments.task_id IS NULL AND ' + queryStringArray.join(" AND ") + orderByClause + limitStr + ';', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT tasks.* FROM tasks LEFT JOIN task_assignments ON tasks.id = task_assignments.task_id WHERE task_assignments.task_id IS NULL ' + orderByClause + limitStr + ';', function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

Tasks.count_all_by_user_id = function(query, user_id, call_back) {
  console.log("count_all_by_user_id called.");

  var queryStringArray = [];
  var queryValuesArray = [];

  if(query) {
    for (var property in query) {
        if (Tasks.schema.hasOwnProperty(property) && query.hasOwnProperty(property) && query[property] && query[property] != null) {
          queryStringArray.push("tasks." + property + " = ?");
          queryValuesArray.push(query[property]);
        } else {
          console.log("Try to access unknown property: " + property);
        }
    }
  }

  queryValuesArray.push(user_id);

  if(queryStringArray.length > 0) {  
    this.db.query('SELECT count(tasks.id) as num_rows FROM tasks INNER JOIN task_assignments ON tasks.id = task_assignments.task_id WHERE '+ queryStringArray.join(" AND ") + ' AND task_assignments.user_id = ?;', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT count(tasks.id) as num_rows FROM tasks INNER JOIN task_assignments ON tasks.id = task_assignments.task_id WHERE task_assignments.user_id = ?;', [user_id], function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

Tasks.find_all_by_user_id = function(query, user_id, call_back) {
  console.log("find_all_by_user_id called.");

  var queryStringArray = [];
  var queryValuesArray = [];

  if(query) {
    for (var property in query) {
        if (Tasks.schema.hasOwnProperty(property) && query.hasOwnProperty(property) && query[property] && query[property] != null) {
          queryStringArray.push("tasks." + property + " = ?");
          queryValuesArray.push(query[property]);
        } else {
          console.log("Try to access unknown property: " + property);
        }
    }
  }

  queryValuesArray.push(user_id);

  //Task Ranking
  var orderByClause =  " ORDER BY tasks.archived ASC, task_assignments.user_pinned DESC, CASE WHEN tasks.status!='finished' THEN -tasks.deadline END DESC, CASE WHEN tasks.status='finished' THEN tasks.deadline END DESC, -tasks.priority ASC, LENGTH(tasks.status) ASC, tasks.id DESC, tasks.updated_at DESC";

  //Pagination
  var limitStr = "";

  if(query && query.limit && parseInt(query.limit) > 0 && query.page && parseInt(query.page) > 1) {
    limitStr = " LIMIT " + (parseInt(query.page)-1)*parseInt(query.limit) + "," + query.limit;
  }
  else if(query && query.limit && parseInt(query.limit) > 0) {
    limitStr = " LIMIT " + query.limit;
  }

  if(queryStringArray.length > 0) {  
    this.db.query('SELECT * FROM tasks INNER JOIN task_assignments ON tasks.id = task_assignments.task_id WHERE '+ queryStringArray.join(" AND ") + ' AND task_assignments.user_id = ? ' + orderByClause + limitStr + ';', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
    this.db.query('SELECT * FROM tasks INNER JOIN task_assignments ON tasks.id = task_assignments.task_id WHERE task_assignments.user_id = ? ' + orderByClause + limitStr + ';', [user_id], function (err, results, fields) {
      call_back(err, results, fields);
    });
  }
}

/*Tasks.find_all_by_project_id = function(project_id, call_back) {
  console.log("find_all_by_project_id called.");

  this.db.query('SELECT * FROM tasks WHERE project_id = ?;', [project_id], function (err, results, fields) {
    call_back(err, results, fields);
  });  
}*/

Tasks.find_by_id = function (id, call_back) {
  console.log("find_by_id called.");

  this.db.query("SELECT * FROM tasks WHERE id = ? LIMIT 1;", [id], function (err, results, fields) {
    call_back(err, results, fields);
  });
}

Tasks.find_name_like = function (str, call_back) {
  console.log("find_by_id called.");

  this.db.query("SELECT * FROM tasks WHERE name LIKE ? LIMIT 1;", ["%"+str+"%"], function (err, results, fields) {
    call_back(err, results, fields);
  });
}


Tasks.add = function(body, call_back) {
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

  this.db.query("INSERT into tasks (" + addStringArray.join(", ") +") values ("+ addMarksArray.join(",")+");", addValuesArray, function(err, results, fields) {
    if(err) {
      console.log(err);
    }
    call_back(err, results, fields);
  });
}

Tasks.update = function(id, body, call_back) {
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

  this.db.query("UPDATE tasks SET " + updateStringArray.join(", ") + " WHERE id = ?;", updateValuesArray, function(err, results, fields) {
    call_back(err, results, fields);
  });  
}

Tasks.delete = function(id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from tasks WHERE id = ?;", [id], function(err, results, fields) {
    call_back(err, results, fields);
  });    
}

module.exports = Tasks;