var RewriteMiddleware = require('../lib/htaccess');
var express = require('./helpers/express');

var expect = require('chai').expect;
var path = require('path');
var supertest = require('supertest');
var async = require('async');

var app = null;

describe('11-url-params', function() {
  before(function (done) {
    app = express(0, RewriteMiddleware({
      verbose: false,
      file: path.resolve(__dirname, 'htaccess_files', '11-url-params.htaccess')
    }));
    done();
  });

  after(function (done) {
    app.close();
    done();
  });

  

  it('RewriteRule ^source1/([0-9]+)/([0-9]+)$ /dest1.php?a=$1&b=$2 [R]', function (done) {
    this.request = supertest(app)
     .get('/source1/123/456')
     .end(function (err, res) {
       expect(res.statusCode).to.equal(302);

       expect(res.header).to.have.property('location');
       expect(res.header.location).to.equal('/dest1.php?a=123&b=456');

       done();
     });
  });

  it('RewriteRule ^source2/([a-z]+)/([\\w]+)$ /dest2.php?a=$1&b=$2&c=$2 [R]', function (done) {
    this.request = supertest(app)
     .get('/source2/abc/xYZ')
     .end(function (err, res) {
       expect(res.statusCode).to.equal(302);

       expect(res.header).to.have.property('location');
       expect(res.header.location).to.equal('/dest2.php?a=abc&b=xYZ&c=xYZ');

       done();
     });
  });
});