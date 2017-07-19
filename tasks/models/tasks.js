var mysql = require('mysql')
var credentials = require('../credentials.js');

//The Tasks model class
var Tasks = function (id, lastname, firstname, title) {

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
  archived: {type: "boolean", description: "Flag to archive the task."}
}

Tasks.connect = function () {
  this.db = mysql.createConnection({
    host: credentials.mysql.host,
    user: credentials.mysql.username,
    password: credentials.mysql.password,
  });

  this.db.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
  });

  Tasks.initialize_db();
}

Tasks.disconnect = function () {
  this.db.end()
}

Tasks.initialize_db = function(call_back) {
  console.log("create_db called.");

  this.db.query('CREATE DATABASE IF NOT EXISTS ryukyu_social_tasks_service;', function(err) {
    if(err) {
      console.log(err);
    }
  });

  this.db.query('USE ryukyu_social_tasks_service;', function(err) {
    if(err) {
      console.log(err);
    }
  });

  this.db.query('CREATE TABLE IF NOT EXISTS tasks (id int NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL, description text, priority int, status varchar(255) DEFAULT "dump", deadline datetime, project_id int, creator_user_id int, archived boolean DEFAULT FALSE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY(id));', function(err) {
    if(err) {
      console.log(err);
    }
  });

  Tasks.create_default_tasks();
}

Tasks.create_default_tasks = function() {
  Tasks.find_all(null, function(err, rows, fields) {
    if(err) {
      console.log(err);
      return;
    }

    if(rows && rows.length == 0) {
      Tasks.add({name:'Task 1', description:'Task 1 description.', priority: 8, project_id: 1, creator_user_id: 2}, function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });

      Tasks.add({name:'Task 2', description:'Task 2 description.', priority: 5, project_id: 1, creator_user_id: 3}, function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });

      Tasks.add({name:'Task 3', description:'Task 3 description.', priority: 7, project_id: 1, creator_user_id: 2}, function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });            

      Tasks.add({name:'Task 4', description:'Task 4 description.', priority: 6, project_id: 2, creator_user_id: 3}, function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });  

      Tasks.add({name:'Task 5', description:'Task 5 description.', priority: 9, project_id: 2, creator_user_id: 2}, function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });  


      Tasks.add({name:'Task 6', description:'Task 6 description.', priority: 8, project_id: 3, creator_user_id: 2}, function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });  

      Tasks.add({name:'Task 7', description:'Task 7 description.', priority: 1, project_id: 3, creator_user_id: 2}, function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });  
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
  var orderByClause =  " ORDER BY archived ASC, CASE WHEN archived=0 THEN -deadline END DESC, CASE WHEN archived=1 THEN -deadline END ASC, -priority ASC, LENGTH(status) ASC, id DESC, updated_at DESC";

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
  var orderByClause =  " ORDER BY tasks.archived ASC, CASE WHEN tasks.archived=0 THEN -tasks.deadline END DESC, CASE WHEN tasks.archived=1 THEN -tasks.deadline END ASC, -tasks.priority ASC, LENGTH(tasks.status) ASC, tasks.id DESC, tasks.updated_at DESC";

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