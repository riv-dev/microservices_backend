process.env.NODE_ENV = 'test';

var faker = require('faker');
var chai = require('chai');
var chaiHttp = require('chai-http');
var credentials = require('../credentials');

//The Application to Test
var app = require('../app');

chai.use(chaiHttp);

var expect = chai.expect;
var should = chai.should();

//Delete all users
describe("Test GET /users", function () {
    it("Should return list of users.", function (done) {
        chai.request(app)
            .get('/users')
            .end(function (err, res) {
                res.should.have.status(200);
                done();
            });
    });
});

describe("Test GET /users/:id", function () {
    it("should get user details.", function (done) {
        chai.request(app)
            .get('/users/1')
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
    });
});



var added_user_id = null;

describe("Test POST /users", function () {
    it("should return authentication error without token.", function (done) {
        chai.request(app)
            .post('/users')
            //.set('x-access-token', credentials.authentication.development_token)
            .type('form')
            .send({
                'firstname': "John",
                'lastname': "Doe",
                'password': "password",
                'email': "john@example.com",
                'admin': 0
            }).end(function (err, res) {
                res.should.have.status(401);
                done();
            });
    });

    it("should add user if email not taken.", function (done) {
        var user_info = {
            'firstname': "John",
            'lastname': "Doe",
            'password': "password",
            'email': "john@example.com",
            'admin': 0
        };
        chai.request(app)
            .post('/users')
            .set('x-access-token', credentials.authentication.development_token)
            .type('form')
            .send(user_info)
            .end(function (err, res) {
                if (res.status == 400 && res.body.errors && res.body.errors[0].param == 'email') {
                    chai.request(app)
                        .delete('/users/' + res.body.errors[0].user_id)
                        .set('x-access-token', credentials.authentication.development_token)
                        .end(function (err, res) {
                            chai.request(app)
                                .post('/users')
                                .set('x-access-token', credentials.authentication.development_token)
                                .type('form')
                                .send(user_info)
                                .end(function (err, ers) {
                                    res.should.have.status(200);
                                    res.body.should.have.property("status").eql("success");
                                    res.body.should.have.property("user_id");
                                    added_user_id = res.body.user_id;
                                    done();
                                });
                        });
                } else {
                    res.should.have.status(200);
                    res.body.should.have.property("status").eql("success");
                    res.body.should.have.property("user_id");
                    added_user_id = res.body.user_id;
                    done();
                }
            });
    });

});



describe("Test POST /users/authentication", function() {
    it("should receive error with wrong credentials", function(done) {
        chai.request(app)
        .post('/users/authenticate')
        .type('form')
        .send({'email':'john@example.com', 'password': 'wrongpass'})
        .end(function(err, res){
            res.should.have.status(401);
            res.body.should.have.property("status").eql("fail");
            done();
        });
    });

    it("should get token with correct credentials", function(done) {
        chai.request(app)
        .post('/users/authenticate')
        .type('form')
        .send({'email':'john@example.com', 'password': 'password'})
        .end(function(err, res){
            res.should.have.status(200);
            res.body.should.have.property("status").eql("success");
            res.body.should.have.property("token");
            done();
        });
    });
});

describe("Test DELETE /users/:user_id", function () {
    it("should return authentication error without token.", function (done) {
        chai.request(app)
            .delete('/users/' + added_user_id)
            //.set('x-access-token', credentials.authentication.development_token)
            .end(function (err, res) {
                res.should.have.status(401);
                done();
            });
    });

    it("should delete user with token.", function (done) {
        chai.request(app)
            .delete('/users/' + added_user_id)
            .set('x-access-token', credentials.authentication.development_token)
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.have.property("status").eql("success");
                res.body.should.have.property("user_id").eql(added_user_id.toString());
                done();
            });
    });
});