var SerialPort = require("serialport");
var Mqtt = require('mqtt');

var mqtt;
var serialPort;
var playerInProgress;

// Coeff multiplicateur pour étaler les valeurs de 1 à 10
var getRank = function (score) {
    return Math.floor(eval(process.env.formule));
};


SerialPort.list(function (err, results) {
    var arduinoDetected = false;
    results.forEach(function (device) {
        if (device.comName.indexOf('/dev/ttyACM') !== -1) {
            console.log('Arduino detect on ' + device.comName);
            var port = device.comName;
            arduinoDetected = true;
            initUSB(port);
            return;
        }
    });
    if (!arduinoDetected) {
        console.log('No Arduino detected!')
    }
})
;

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
    console.log('Serial port is open');
    initMQTT();
    serialPort.write('STOP');
    serialPort.on('data', onSerialData);
};

var onSerialData = function (data) {
    console.log("Inconimng message on serial port (Arduino): " + data);
    var score = data.replace('\r', '');
    var rank = getRank(score);
    console.log("Score is : " + score)
    console.log("Rank is : " + rank)
    serialPort.write(String(rank));
    var message = JSON.parse(playerInProgress);
    message.game = {"score": score, "rank": rank};
    mqtt.publish('results', JSON.stringify(message));
    console.log('MQTT - Publish on Topic results: ' + JSON.stringify(message));
};

var initMQTT = function () {
    mqtt = Mqtt.connect('mqtt://mqtt');
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