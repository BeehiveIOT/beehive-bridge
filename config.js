exports.config = {
  validMqttIps: ['127.0.0.1',],
  http: {
    port: 9999,
    host: '0.0.0.0'
  },
  mqtt: {
    port: 1883,
    host: 'localhost'
  }
};
