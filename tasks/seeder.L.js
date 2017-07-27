var faker = require('faker');
var chai = require('chai');
var chaiHttp = require('chai-http');
var credentials = require('./credentials');
var moment = require('moment');

chai.use(chaiHttp);
var expect = chai.expect;

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomStatus(start_date, deadline) {
  var random = randomIntFromInterval(0, 10);
  if (moment(deadline) < moment()) {
    if (random > 3) {
      return "finished";
    } else {
      return "doing"
    }
  } else if (moment(start_date) < moment()) {
    if (random > 8) {
      return "finished";
    } else if (random > 5) {
      return "doing";
    } else if (random > 3) {
      return "waiting";
    } else {
      return "dump";
    }
  } else {
    return "dump";
  }
}

function randomWriteAccess() {
  var random = randomIntFromInterval(0,10);
  if(random > 8) {
    return 2;
  } else if(random > 3) {
    return 1;
  } else {
    return 0;
  }
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
  seed_data: function (app) {
    chai.request("http://localhost:5003")
      .get('/tasks')
      .set('x-access-token', credentials.authentication.development_token)
      .end(function (err, res) {
        if (res.body && res.body.length == 0) {
          faker.seed(123);

          for (var i = 0; i < 500; i++) {
            var name = capitalize(faker.hacker.verb()) + " " + faker.commerce.productName();
            var description = faker.lorem.words(randomIntFromInterval(50, 200));
            var priority = randomIntFromInterval(0, 4);
            var status = randomStatus(new Date(moment().format()), deadline);
            var deadline = randomDate(new Date(moment().format()), new Date(moment().add(4, 'months').format()));
            var project_id = randomIntFromInterval(1, 25);
            var creator_user_id = randomIntFromInterval(1, 25);
            var archived = 0;

            if(status == "finished") {
              var random = randomIntFromInterval(0,10);
              if(random > 3) {
                archived = 1;
              } else {
                archived = 0;
              }
            }

            console.log("Task name: " + name);
            console.log("Task description: " + description);
            console.log("Priority: " + priority);
            console.log("Status: " + status);
            console.log("Deadline: " + moment(deadline).calendar());
            console.log("Project ID: " + project_id);
            console.log("Creator USER ID: " + creator_user_id);
            console.log("Archived: " + archived);

            var task = {
              'name': name,
              'description': description,
              'priority': priority,
              'status': status,
              'deadline': deadline,
              'project_id': project_id,
              'creator_user_id': creator_user_id,
              'archived': archived
            }

            chai.request("http://localhost:5003")
              .post('/tasks')
              .set('x-access-token', credentials.authentication.development_token)
              .type('form')
              .send(task)
              .end(function (err, res) {
                //expect(err).to.be.null;
                //expect(res).to.have.status(200);
                console.log(JSON.stringify(res.body));
                if (res.status == 200 && res.body.task_id) {
                  var randomLength = randomIntFromInterval(0, 2); 
                  for (var i = 0; i < randomLength; i++) {
                    var random_user_id = randomIntFromInterval(1, 25); //Users Service development data uses Small Set = 25
                    chai.request("http://localhost:5003")
                      .post('/tasks/' + res.body.task_id + '/users/' + random_user_id)
                      .set('x-access-token', credentials.authentication.development_token)
                      .type('form')
                      .send({})
                      .end(function (err, res) {
                        console.log(JSON.stringify(res.body));
                      });
                  }
                }
              });
          } //end for
        } //end if
      }); //end .end()
  }
}