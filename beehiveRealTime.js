var sockjs = require('sockjs');
var mqtt = require('mqtt');
var config = require('./config').config;
var dataStorage = require('./storage/data-storage');

var authenticationHandler = function(socket, data) {
  var mqttClient = mqtt.createClient(config.mqtt.port, config.mqtt.host, {
    username: data.username,
    password: data.password
  });
  socket.mqttClient = mqttClient;

  mqttClient.on('message', function(topic, message) {
    socket.write(JSON.stringify({
      event: topic,
      data: message,
      isTopic: true
    }));
  });

  mqttClient.on('connect', function() {
    console.log('MQTT CONNECTED SUCCESSFULLY');

    socket.write(JSON.stringify({
      event: 'connect',
      data: 'WebSocket connected successfully',
      isTopic: false
    }));
  });

  mqttClient.on('error', function(err) {
    console.log('MQTT CONNECTION ERROR', err);

    socket.write(JSON.stringify({
      event: 'error',
      data: 'Invalid MQTT Authorization',
      isTopic: false
    }));

    socket.close();
    this.end();
  });
};

var subscribeHandler = function(socket, data) {
  var mqttClient = socket.mqttClient;
  console.log('SUBSCRIBING TO:', data.topic);
  mqttClient.subscribe(data.topic);
};


var sockjsHandlers = {
  'auth'      : authenticationHandler,
  'subscribe' : subscribeHandler
};

var onDataHandler = function(msg) {
  if (sockjsHandlers[msg.event]) {
    console.log('Executing Event: ', JSON.stringify(msg.data));
    sockjsHandlers[msg.event].call(this, this, msg.data);
  }
};

var echoServer = sockjs.createServer({
  sockjs_url: 'http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js',
  websocket: true
});

echoServer.on('connection', function(socket) {
  socket.on('data', function(message) {
    try {
      var data = JSON.parse(message);
      onDataHandler.call(this, data);
    } catch(e) {
      socket.write(JSON.stringify({
        event: 'error',
        data: 'Message should be JSON formatted.'
      }));
    }
  });

  socket.on('close',function() {
    console.log('WebSocket connection closed.');
  });
});

var userPassword = config.mqtt.generalServer.userPassword;
var generalMqttClient = mqtt.createClient(config.mqtt.port, config.mqtt.host, {
  username: userPassword,
  password: userPassword
});

generalMqttClient.on('connect', function() {
  console.log('GENERAL MQTT CLIENT CONNECTED SUCCESSFULLY');
  generalMqttClient.subscribe('#');
});

generalMqttClient.on('message', function(topic, message) {
  if (topic.length <= 37) { return; }

  var data = {
    pubKey: topic.substring(0,36),
    dataStream: topic.substring(37),
    time: new Date().getTime(),
    value: message
  };
  if (dataStorage && dataStorage.connected) {
    dataStorage.insert(data);
  }
});

generalMqttClient.on('error', function(err) {
  this.end();
});

var onStorageConnected = function(storage) {
  console.log('Connected to storage');
};
var onStorageClosed = function() {
  console.log('Storage connection closed');
};

function initDataStorage() {
  var options = config.storage;
  var events = {
    onConnected: onStorageConnected,
    onClosed: onStorageClosed
  };

  dataStorage = dataStorage.createDataStorage(options.type, options[options.type], events);
  dataStorage.connect();
}

exports.createRealTimeServer = function() {
  initDataStorage();

  return echoServer;
};

exports.generalMQTTClient = generalMqttClient;
