var MongoClient = require('mongodb').MongoClient;

function getUrl(options) {
  var url = 'mongodb://';
  url += options.host + ':' + options.port;
  url += '/' + options.database;
  return url;
}

function onConnected(err, db) {
  if (err) { console.error(err); throw err; }
  this.db = db;
  this.connected = true;
  if (this.events.onConnected) {
    this.events.onConnected.call(null, this);
  }
}

var MongoDataStorage = function(options, events) {
  this.options = options;
  this.events = events;
  this.connected = false;
};

MongoDataStorage.prototype = {
  connect: function() {
    var url = getUrl(this.options);
    MongoClient.connect(url, onConnected.bind(this));
  },
  insert: function(rawData, callback) {
    var data = {
      pubKey: rawData.pubKey,
      dataStream: rawData.dataStream,
      time: rawData.time,
      value: rawData.value
    };
    var collection = this.options.dataCollection;
    this.db.collection(collection).insertOne(data, function(err, result) {
      if (err) { console.error(err); throw err; }
      if (callback) { callback.call(); }
    });
  },
  close: function() {
    this.db.close();
    if (this.events.onClosed) {
      this.events.onClosed.call();
    }
  }
};

exports.createDataStorage = function(options, events) {
  return new MongoDataStorage({
    host: options.host || 'localhost',
    port: options.port || 27017,
    database: options.database || 'beehive',
    dataCollection: options.dataCollection || 'deviceData',
  }, {
    onConnected: events.onConnected,
    onClosed: events.onClosed || null
  });
};
