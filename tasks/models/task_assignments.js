var mysql = require('mysql')
var credentials = require('../credentials.js');

//The TaskAssignments model class
var TaskAssignments = function (id, lastname, firstname, title) {

}

//Static Methods and Variables
TaskAssignments.db = "Yo!";

TaskAssignments.schema = {
  task_id: {type: "int", required: true, description: "Usually defined in the URL"},
  user_id: {type: "int", required: true, description: "Usually defined in the URL"},
  progress_description: {type: "text", required: false}
}

TaskAssignments.connect = function () {
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

  TaskAssignments.initialize_db();
}

TaskAssignments.disconnect = function () {
  this.db.end()
}

TaskAssignments.initialize_db = function(call_back) {
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

  this.db.query('CREATE TABLE IF NOT EXISTS task_assignments (id int NOT NULL AUTO_INCREMENT, task_id int NOT NULL, user_id int NOT NULL, progress_description text, PRIMARY KEY(id));', function(err) {
    if(err) {
      console.log(err);
    } 
  });

  TaskAssignments.create_default_task_assignments();
}

TaskAssignments.create_default_task_assignments = function() {
  TaskAssignments.find_all(function(err, rows, fields) {
    if(err) {
      console.log(err);
      return;
    }

    if(rows && rows.length == 0) {
      TaskAssignments.add(1,2, "Added to task", function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });

      TaskAssignments.add(2,3, "Added to task", function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });

      TaskAssignments.add(3,2, "Added to task", function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });

      TaskAssignments.add(4,2, "Added to task", function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });

      TaskAssignments.add(5,3, "Added to task", function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });

      TaskAssignments.add(6,2, "Added to task", function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });

      TaskAssignments.add(7,2, "Added to task", function(err, rows, field) {
         if(err) {
           console.log(err);
         }
      });
    }
   
  });
}

TaskAssignments.find_all = function (call_back) {
  console.log("find_all called.");

  this.db.query('SELECT * FROM task_assignments;', function (err, results, fields) {
    call_back(err, results, fields);
  });
}

TaskAssignments.find_by_user_id = function (user_id, call_back) {
  console.log("find_by_id called.");

  this.db.query("SELECT * FROM task_assignments WHERE user_id = ?;", [user_id], function (err, results, fields) {
    call_back(err, results, fields);
  });
}

TaskAssignments.find_all_users_by_task_id = function(task_id, call_back) {
  console.log("find_by_id called.");

  this.db.query("SELECT user_id, progress_description FROM task_assignments WHERE task_id = ?;", [task_id], function (err, results, fields) {
    call_back(err, results, fields);
  });  
}

TaskAssignments.find_by_task_id = function (task_id, call_back) {
  console.log("find_by_id called.");

  this.db.query("SELECT * FROM task_assignments WHERE task_id = ?;", [task_id], function (err, results, fields) {
    call_back(err, results, fields);
  });
}

TaskAssignments.find_task_assignment = function(task_id, user_id, call_back) {
  console.log("find_task_user_pairing called.");

  this.db.query("SELECT * FROM task_assignments WHERE task_id = ? AND user_id = ? LIMIT 1;", [task_id, user_id], function (err, results, fields) {
    call_back(err, results, fields);
  });
}

TaskAssignments.add = function(task_id, user_id, progress_description, call_back) {
  console.log("add called.");
  this.db.query("INSERT into task_assignments (task_id, user_id, progress_description) values (?,?,?);", [task_id, user_id, progress_description], function(err, results, fields) {
    if(err) {
      console.log(err);
    }
    call_back(err, results, fields);
  });
}

TaskAssignments.update = function(task_id, user_id, body, call_back) {
  console.log("update called");

  var updateStringArray = [];
  var updateValuesArray = [];

  for (var property in body) {
      if (body.hasOwnProperty(property)) {
        updateStringArray.push(property + " = ?");
        updateValuesArray.push(body[property]);
      }
  }

  updateValuesArray.push(task_id);
  updateValuesArray.push(user_id);

  console.log(updateStringArray.join(", "));
  console.log(updateValuesArray.join(", "));

  this.db.query("UPDATE task_assignments SET " + updateStringArray.join(", ") + " WHERE task_id = ? AND user_id = ?;", updateValuesArray, function(err, results, fields) {
    call_back(err, results, fields);
  });  
}

TaskAssignments.delete = function(task_id, user_id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from task_assignments WHERE task_id = ? AND user_id = ?;", [task_id, user_id], function(err, results, fields) {
    call_back(err, results, fields);
  });    
}

TaskAssignments.delete_all = function(task_id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from task_assignments WHERE task_id = ?;", [task_id], function(err, results, fields) {
    call_back(err, results, fields);
  });
}

module.exports = TaskAssignments;