http = require('http');

var requestHandlers = {
  GET:    {},
  POST:   {},
  PUT:    {},
  DELETE: {},
};

var
route = function(method, path, callback) {
  method = method.toUpperCase();
  requestHandlers[method][path] = callback;
},

getHandler = function(method, path) {
  method = method.toUpperCase();
  if (requestHandlers[method][path]) {
    return requestHandlers[method][path];
  }
},

processHandler = function(handler, req, res) {
  if (req.method !== 'GET') {
    if (req.headers['content-type'] !== 'application/json') {
      res.setHeader('content-type', 'application/json');
      res.writeHead(400);
      res.end(JSON.stringify({status: 'Data must be JSON-formatted'}));

      return;
    }

    req.on('data', function(data) {
      data = JSON.parse(data);

      // This will make it simpler for handler to get different request's info
      req.input = data;
      req.ip = req.connection.remoteAddress;

      // Call the handler with valid data, and easy to use request variables
      handler(req, res);
    });
  } else {
    handler(req, res);
  }
},

createHttpServer = function() {
  var server = http.createServer();

  server.addListener('request', function(req, res) {
    var url = req.url, method = req.method;

    handler = getHandler(method, url);
    if (handler) {
      processHandler(handler, req, res);
    } else {
      res.setHeader('content-type', 'text/plain');
      res.writeHead(200);
      res.end('Beehive Bridge.');
    }
  });

  server.addListener('upgrade', function(req, res) {
    res.end();
  });
  return server;
};

exports.route = route;
exports.createHttpServer = createHttpServer;
