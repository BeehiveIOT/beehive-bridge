var mqtt = require('mqtt');
var config = require('./config').config;
var beehive = require('./beehiveHttp');
var realTime = require('./beehiveRealTime');

var httpServer = beehive.createHttpServer();
var realTimeServer = realTime.createRealTimeServer();
var validMqttIps = config.validMqttIps;
var generalMqttClient = realTime.generalMQTTClient;

// Start http server and attach real-time server to it
httpServer.listen(config.http.port, config.http.host);
realTimeServer.installHandlers(httpServer, {prefix: '/echo'});

function validIp(ip){
  for(var i = 0; i < validMqttIps.length; ++i) {
    if (ip === validMqttIps[i]) {
      return true;
    }
  }
  return false;
}

/**
 * Publish to a specific topic, it can be called
 */
beehive.route('POST', '/mqtt/publish', function(req, res) {
  res.setHeader('content-type', 'application/json');
  if (!validIp(req.ip)) {
    res.writeHead(400);
    res.end(JSON.stringify({status: 'Invalid client'}));
    return;
  }

  var data = req.input;

  try {
    // Message should always be string
    console.log('Executing Command: ', data.topic, data.payload);
    generalMqttClient.publish(data.topic, JSON.stringify(data.payload));
  } catch(e) {
    console.log('MQTT PUBLISH ERROR', e);
  }

  res.writeHead(200);
  res.end(JSON.stringify(data));
});

