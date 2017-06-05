var mysql = require('mysql')
var credentials = require('../../credentials.js');

var Patches = function() {

}

//Static Methods and Variables
Patches.db = "Yo!";

Patches.connect = function () {
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
}

Patches.disconnect = function () {
  this.db.end()
}

Patches.apply_patch = function(call_back) {
  Patches.connect();

  console.log("apply_patch called.");

  this.db.query('USE ryukyu_social_tasks_service;', function(err) {
    if(err) {
      console.log(err);
    }
  });

  this.db.query('ALTER TABLE task_assignments DROP COLUMN status;', function(err) {
    if(err) {
      console.log(err);
    } 
  });

  this.db.query('ALTER TABLE tasks CHANGE status status varchar(255) DEFAULT "New";', function(err) {
    if(err) {
      console.log(err);
    } 
  });
 
  this.db.query('ALTER TABLE task_assignments CHANGE status_description progress_description;', function(err) {
    if(err) {
      console.log(err);
    } 
  });

  this.db.query('ALTER TABLE tasks CHANGE user_id creator_user_id int;', function(err) {
    if(err) {
      console.log(err);
    } 
  });  

  this.db.query('ALTER TABLE tasks ADD COLUMN parent_task_id int;', function(err) {
    if(err) {
      console.log(err);
    } 
  });    

  Patches.disconnect();

}

Patches.reverse_patch = function(call_back) {
  Patches.connect();

  this.db.query('ALTER TABLE task_assignments ADD status int DEFAULT 0;', function(err) {
    if(err) {
      console.log(err);
    } 
  });    

  this.db.query('ALTER TABLE tasks CHANGE status status int DEFAULT 0;', function(err) {
    if(err) {
      console.log(err);
    } 
  });

  this.db.query('ALTER TABLE task_assignments CHANGE progress_description status_description;', function(err) {
    if(err) {
      console.log(err);
    } 
  });   

  this.db.query('ALTER TABLE tasks CHANGE creator_user_id user_id int;', function(err) {
    if(err) {
      console.log(err);
    } 
  });  

  this.db.query('ALTER TABLE tasks DROP COLUMN parent_task_id;', function(err) {
    if(err) {
      console.log(err);
    } 
  });

  Patches.disconnect();
}

module.exports = Patches;