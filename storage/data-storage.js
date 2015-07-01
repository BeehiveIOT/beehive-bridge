/*
 * Another storage may be used, so in order to save to that storage
 * var CassandraDataStorage = require(./cassandra-storage);
 * ...
 * case 'cassandra':
 *   return CassandraDataStorage.createDataStorage(options);
 */
var MongoDataStorage = require('./mongo-storage');

exports.createDataStorage = function(type, options, events) {
  events = events || {};
  options = options || {};

  switch(type) {
    case 'mongodb':
      return MongoDataStorage.createDataStorage(options, events);
    default:
      throw new Error('Invalid storage type');
  }
};
