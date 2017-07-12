var SerialPort = require("serialport");
var Mqtt = require('mqtt');

var mqtt;
var serialPort;
var playerInProgress;

SerialPort.list(function (err, results) {
    results.forEach(function (device) {
        if (device.manufacturer !== undefined && device.manufacturer.indexOf('Arduino') !== -1) {
            console.log('Arduino detect on ' + device.comName);
            var port = device.comName;
            initUSB(port);
            return;
        }
    });
    console.log('No Arduino detected!')

});

var initUSB = function (port) {
    serialPort = new SerialPort(port, {
        baudrate: 9600,
        parser: SerialPort.parsers.readline("\n"),
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false
    });
    // Serial port is open
    serialPort.on('open', onSerialOpen);
};

var onSerialOpen = function () {
    console.log('Port ' + serialPort.port+ ' is open');
    initMQTT();
    serialPort.on('data', onSerialData);
};

var onSerialData = function (data) {
    var message = JSON.parse(playerInProgress);
    message.game = {score: data.replace('\r', '')};
    mqtt.publish('results', JSON.stringify(message));
};

var initMQTT = function () {
    mqtt = Mqtt.connect('mqtt://localhost');
    mqtt.on('connect', onMQTTConnect);
    mqtt.on('message', onMQTTMessage);
};


var onMQTTConnect = function () {
    console.log('MQTT is connected');
    mqtt.subscribe('start');
    mqtt.subscribe('stop');
};

var onMQTTMessage = function (topic, message) {
    console.log('MQTT - Message on Topic ' + topic + ' : ' + message);
    switch (topic) {
        case 'start':
            playerInProgress = message.toString().replace(/\n/g, '');
            serialPort.write('START');
            break;
        case 'stop':
            serialPort.write('STOP');
            break;
        default:
    }
};