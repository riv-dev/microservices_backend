process.env.NODE_ENV = 'test';

var faker = require('faker');
var chai = require('chai');
var chaiHttp = require('chai-http');
var credentials = require('../credentials');
var fs = require("fs");

//The Application to Test
var app = require('../app');

chai.use(chaiHttp);

var expect = chai.expect;
var should = chai.should();

var added_project_id = null,
    filename = 'crab.jpg';

describe("Test POST /projects/:id/file", function () {
    it("should return authentication error without token.", function (done) {
        chai.request(app)
            .post('/projects/1/file')
            //.set('x-access-token', credentials.authentication.development_token)
            .type('form')
            .field('name', 'John')
            .attach('file', fs.readFileSync('test/' + filename), filename)
            .end(function (err, res) {
                res.should.have.status(401);
                done();
            });
    });

    it("should add project file if project id not taken.", function (done) {
        chai.request(app)
            .post('/projects/1/file')
            .set('x-access-token', credentials.authentication.development_token)
            .type('form')
            .field('name', 'John')
            .attach('file', fs.readFileSync('test/' + filename), filename)
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.have.property("status").eql("success");
                done();
            });
    });

});

describe("Test GET /projects/:id/file", function () {
    it("should get project file details.", function (done) {
        chai.request(app)
            .get('/projects/1/file')
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
    });
});

describe("Test DELETE /projects/:id/file", function () {
    it("should return authentication error without token.", function (done) {
        chai.request(app)
            .delete('/projects/1/file')
            //.set('x-access-token', credentials.authentication.development_token)
            .end(function (err, res) {
                res.should.have.status(401);
                done();
            });
    });

    it("should delete user with token.", function (done) {
        chai.request(app)
            .delete('/projects/1/file')
            .set('x-access-token', credentials.authentication.development_token)
            .end(function (err, res) {
                res.should.have.status(200);
                res.body.should.have.property("status").eql("success");
                done();
            });
    });
});