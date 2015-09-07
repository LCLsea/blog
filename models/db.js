var config = require('../config'),
    Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server;

module.exports = new Db(config.mongo.db, new Server(config.mongo.host, config.mongo.port),
  {safe: true});
