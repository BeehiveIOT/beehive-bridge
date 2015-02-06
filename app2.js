var mqtt = require('mqtt');
var config = require('./config');
var beehive = require('./beehiveBridge');
var realTime = require('./realTime');

var httpServer = beehive.createHttpServer();
var realTimeServer = realTime.createRealTimeServer();
var validMqttIps = config.validMqttIps;
var generalMqttClient =

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

  res.writeHead(200);
  res.end(JSON.stringify(data));
});

