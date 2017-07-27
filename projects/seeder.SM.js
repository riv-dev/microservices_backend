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
    } else if (random > 2) {
      return "doing";
    } else {
      return "new";
    }
  } else {
    return "new";
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

function randomProjectUserStatus(start_date, deadline) {
  var random = randomIntFromInterval(0,10);
  if (moment(deadline) < moment()) {
    if (random > 3) {
      return "inactive";
    } else {
      return "active"
    }
  } else if (moment(start_date) < moment()) {
    if (random > 8) {
      return "inactive";
    } else {
      return "active";
    }
  } else {
    return "inactive";
  }
}

module.exports = {
  seed_data: function (app) {
    chai.request("http://localhost:5002")
      .get('/projects')
      .set('x-access-token', credentials.authentication.development_token)
      .end(function (err, res) {
        if (res.body && res.body.length == 0) {
          faker.seed(123);

          for (var i = 0; i < 25; i++) {
            var name = faker.commerce.productName();
            var description = faker.lorem.words(randomIntFromInterval(100, 300));
            var start_date = randomDate(new Date(moment().subtract(5, 'months').format()), new Date(moment().add(3, 'months').format()));
            var deadline = randomDate(start_date, new Date(moment(start_date).add(4, 'months').format()));
            var value = randomIntFromInterval(500, 10000);
            var effort = randomIntFromInterval(0, value);
            var status = randomStatus(start_date, deadline);

            /*console.log("Project name: " + name);
            console.log("Project description: " + description);
            console.log("Start Date: " + moment(start_date).calendar());
            console.log("Deadline: " + moment(deadline).calendar());
            console.log("Value: " + value);
            console.log("Effort: " + effort);
            console.log("Status: " + status);*/

            var project = {
              'name': name,
              'description': description,
              'start_date': start_date,
              'deadline': deadline,
              'value': value,
              'effort': effort,
              'status': status
            }

            chai.request("http://localhost:5002")
              .post('/projects')
              .set('x-access-token', credentials.authentication.development_token)
              .type('form')
              .send(project)
              .end(function (err, res) {
                //expect(err).to.be.null;
                //expect(res).to.have.status(200);
                console.log(JSON.stringify(res.body));
                if (res.status == 200 && res.body.project_id) {
                  for (var i = 0; i < randomIntFromInterval(0, 8); i++) {
                    var random_user_id = randomIntFromInterval(1, 25); //Users Service development data uses Small Set = 25
                    chai.request("http://localhost:5002")
                      .post('/projects/' + res.body.project_id + '/users')
                      .set('x-access-token', credentials.authentication.development_token)
                      .type('form')
                      .send({
                        user_id: random_user_id, status: randomProjectUserStatus(start_date,deadline), write_access: randomWriteAccess()  
                      })
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