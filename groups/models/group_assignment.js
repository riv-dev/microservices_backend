var mysql = require('mysql')
var credentials = require('../credentials.js');

//The ProjectUsers model class
var GroupAssignment = function (id, lastname, firstname, title) {

}

var db_name = {
  development: "ryukyu_social_groups_service_dev",
  test: "ryukyu_social_groups_service_test",
  production: "ryukyu_social_groups_service"
}

//Static Methods and Variables
GroupAssignment.db = "Yo!";

GroupAssignment.connect = function (env) {
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

	GroupAssignment.initialize_db(env);
}
  
GroupAssignment.disconnect = function () {
	this.db.end()
}
  
GroupAssignment.initialize_db = function(env, call_back) {
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

	this.db.query('CREATE TABLE IF NOT EXISTS group_assignment (id int NOT NULL AUTO_INCREMENT, group_id int NOT NULL, item_id int NOT NULL, item_type varchar(255) NOT NULL, PRIMARY KEY(id), CONSTRAINT FK_GroupAssignment FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE);', function(err) {
		if(err) {
			console.log(err);
		} 
	});

}

GroupAssignment.find_all = function(query, call_back) {
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

	if (queryStringArray.length > 0) {
    this.db.query('SELECT * FROM group_assignment WHERE ' + queryStringArray.join(" AND ") + ';', queryValuesArray, function (err, results, fields) {
      call_back(err, results, fields);
    });
  } else {
		this.db.query('SELECT * FROM group_assignment;', function (err, results, fields) {
			call_back(err, results, fields);
		});
	}
}

GroupAssignment.add = function(group_id, item_id, item_type, call_back) {
	console.log("add called.");
	this.db.query("INSERT into group_assignment (group_id, item_id, item_type) values (?,?,?);", [group_id, item_id, item_type], function(err, results, fields) {
	  if(err) {
			console.log(err);
	  }
	  call_back(err, results, fields);
	});
}

GroupAssignment.update = function(group_id, item_id, item_type, body, call_back) {
  console.log("update called");

  var updateStringArray = [];
  var updateValuesArray = [];

  for (var property in body) {
      if (body.hasOwnProperty(property)) {
        updateStringArray.push(property + " = ?");
        updateValuesArray.push(body[property]);
      }
  }

  updateValuesArray.push(group_id);
	updateValuesArray.push(item_id);
	updateValuesArray.push(item_type);

  console.log(updateStringArray.join(", "));
  console.log(updateValuesArray.join(", "));

  this.db.query("UPDATE group_assignment SET " + updateStringArray.join(", ") + " WHERE group_id = ? AND item_id = ? AND item_type = ?;", updateValuesArray, function(err, results, fields) {
    call_back(err, results, fields);
  });  
}

GroupAssignment.delete = function(group_id, item_id, item_type, call_back) {
  console.log("delete called");

  this.db.query("DELETE from group_assignment WHERE group_id = ? AND item_id = ? AND item_type = ?;", [group_id, item_id, item_type], function(err, results, fields) {
    call_back(err, results, fields);
  });    
}

GroupAssignment.delete_all = function(group_id, call_back) {
  console.log("delete called");

  this.db.query("DELETE from group_assignment WHERE group_id = ?;", [group_id], function(err, results, fields) {
    call_back(err, results, fields);
  });
}

module.exports = GroupAssignment;