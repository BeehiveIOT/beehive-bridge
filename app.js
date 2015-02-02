var http = require("http");
var sockjs = require("sockjs");
var mqtt = require('mqtt');
var request = require('request');

var echoServer = sockjs.createServer({
  sockjs_url: 'http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js',
  websocket: true
});

var authenticationHandler = function(socket, data) {
  var mqttClient = mqtt.createClient(1883, 'localhost', {
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

// var publishHandler = function(socket, data) {
//   // TODO: use mqtt client to publish ... TBD
// };

var subscribeHandler = function(socket, data) {
  var mqttClient = socket.mqttClient;
  console.log('SUBSCRIBING TO:', data.topic);
  mqttClient.subscribe(data.topic);
};


var sockjsHandlers = {
  'auth'      : authenticationHandler,
  // 'publish'   : publishHandler,
  'subscribe' : subscribeHandler
};

var onDataHandler = function(msg) {
  if (sockjsHandlers[msg.event]) {
    console.log("Executing: ", JSON.stringify(msg.data));
    sockjsHandlers[msg.event].call(this, this, msg.data);
  }
};

echoServer.on("connection", function(socket) {
  socket.on("data", function(message) {
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

  socket.on("close",function() {
    console.log("WebSocket connection closed.");
  });
});

var server = http.createServer();
// To show at least a simple message when somebody browses [domain]:9999
server.addListener("request", function(req, res) {
  res.setHeader("content-type", "text/plain");
  res.writeHead(200);
  res.end("WebSocket server");
});
server.addListener("upgrade", function(req, res) {
  res.end();
});

// Mix http server with websockets server
echoServer.installHandlers(server, {prefix: "/echo"});
// In order to be used around a network, it should load configurations
server.listen(9999, "0.0.0.0");
