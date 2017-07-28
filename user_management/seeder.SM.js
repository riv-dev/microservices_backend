var faker = require('faker');
var chai = require('chai');
var chaiHttp = require('chai-http');
var credentials = require('./credentials');

chai.use(chaiHttp);
var expect = chai.expect;

module.exports = {
    seed_data: function (app) {
      chai.request("http://localhost:7000")
        .get('/users')
        .set('x-access-token', credentials.authentication.development_token)
        .end(function (err, res) {
          if(res.body && res.body.length && res.body.length < 2) {
            faker.seed(123);

            for(var i=0;i<25;i++) {
              var firstname = faker.name.firstName();
              var lastname = faker.name.lastName();
              var email = faker.internet.email(firstname,lastname); 

              console.log(firstname + " " + lastname + ": " + email);

              chai.request("http://localhost:7000")
                .post('/users')
                .set('x-access-token', credentials.authentication.development_token)
                .type('form')
                .send({
                  'firstname': firstname,
                  'lastname': lastname,
                  'password': "password" + firstname,
                  'email': email,
                  'admin': 0
                }).end(function (err, res) {
                  //expect(err).to.be.null;
                  //expect(res).to.have.status(200);
                });
            } //end for
          } //end if
        }); //end .end()
    }
}