'use strict';

var _ = require('lodash');
var url = require('url');

var fs = require('fs');
var util = require('util');
var path = require('path');
var stat = util.promisify(fs.stat);


function RewriteCond(baseCondition, opts) {
  _.assign(this, baseCondition);
  opts = opts || {};

  this.doMatch = true;
  this.envVarRegexp = /%{ENV:(.+)}$/;
  this.documentRoot = opts.documentRoot;

  if (this.pattern[0] === '!') {
    this.pattern = this.pattern.substring(1);
    this.doMatch = false;
  } else if (this.pattern[0] === '=') {
    this.pattern = '^' + this.pattern.substring(1) + '$';
  }

  if (this.pattern == '-f') {
    this.matcher = isFile
  } else if (this.pattern == '-d') {
    this.matcher = isDir
  } else if (this.flags.indexOf('NC') !== -1) {
    this.re = new RegExp(this.pattern, 'i');
  } else {
    this.re = new RegExp(this.pattern);
  }

  this.matchResult = null;
}


RewriteCond.prototype.matches = async function (req) {
  var value = '';
  var envMatch = this.envVarRegexp.exec(this.variable);

  if (envMatch) {
    var envVar = envMatch[1];
    value = process.env[envVar] || '';
  } else if (this.variable === '%{HTTP_USER_AGENT}') {
    value = req.headers['user-agent'];
  } else if (this.variable === '%{REQUEST_METHOD}') {
    value = req.method.toUpperCase();
  } else if (this.variable === '%{HTTP_REFERER}') {
    value = req.headers.referer;
  } else if (this.variable === '%{HTTP_HOST}') {
    value = req.headers.host;
  } else if (this.variable === '%{REQUEST_FILENAME}') {
    value = url.parse(req.url).pathname;
  } else if (this.variable === '%{REQUEST_URI}') {
    value = url.parse(req.url).pathname;
  } else if (this.variable === '%{THE_REQUEST}') {
    value = req.url;
  } else if (this.variable === '%{QUERY_STRING}') {
    value = url.parse(req.url).query;
  }

  if (this.matcher) {
    this.matchResult = await this.matcher(this.documentRoot, value);
  } else if (this.re) {
    this.matchResult = this.re.exec(value);
  }

  if (!this.matchResult) {
    return !this.doMatch;
  } else {
    return this.doMatch;
  }
};

module.exports = RewriteCond;

async function isFile(root, f) {
  try {
    return (await stat(path.join(root, f))).isFile();
  } catch (e) {
    if (e.code == 'ENOENT') return false;
    throw e;
  }
}
async function isDir(root, f) {
  try {
    return (await stat(path.join(root, f))).isDirectory();
  } catch (e) {
    if (e.code == 'ENOENT') return false;
    throw e;
  }
}
