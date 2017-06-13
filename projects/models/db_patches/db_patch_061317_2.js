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

  this.db.query('USE ryukyu_social_projects_service;', function(err) {
    if(err) {
      console.log(err);
    }
  });

  this.db.query('UPDATE projects SET status = "new" WHERE status IS NULL OR status = 0;', function(err) {
    if(err) {
      console.log(err);
    } 
  });
 
  Patches.disconnect();

}

Patches.reverse_patch = function(call_back) {
  Patches.connect();

  Patches.disconnect();
}

module.exports = Patches;