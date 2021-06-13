const {AsBind} = require("as-bind");
const fs = require("fs");
const { performance } = require('perf_hooks');

var KEY = fs.readFileSync(__dirname +'/secret/server.key')
var CERT = fs.readFileSync(__dirname +'/secret/server.crt')
var TRUSTED_CA_LIST = fs.readFileSync(__dirname +'/secret/ca.crt')

//One can add JS functions that are called in Wasm in imports
const imports = { /* imports go here */ };

const wasmModule = AsBind.instantiateSync(fs.readFileSync(__dirname + "/build/optimized.wasm"), imports);
module.exports = wasmModule.exports; //module.exports refers exports property of wasmModule. It allows us to use a wasmModule like a JSModule.

// Get our memory object from the exports
//const memory = module.exports.memory;
// Create a shared Uint8Array. It can be accessed from both of Wasm and JS.
//const wasmByteMemoryArray = new Uint8Array(memory.buffer);

//functions in WasmModule can be also declared like following:
//const JsonEncoderWasm = wasmModule.exports.JsonEncoderWasm;
const JsonEncoderWasm = require('./index').JsonEncoderWasm;
const setAxisData = require('./index').setAxisData;
const getDistance = require('./index').getDistance;
const isUnsafe = require('./index').isUnsafe;
const getMQTTOptions = require('./index').getMQTTOptions;




const SerialPort = require('serialport');
const ByteLength = require('@serialport/parser-byte-length');

const port = new SerialPort('/dev/cu.usbserial-0001', {
    baudRate: 9600,
    autoOpen: false
})

const MEASURE_TIMES = 100
let startCounter = 0
let arrivalCounter = 0

const serial_read = function() {
    
    port.open(function (err){
        if (err) {
            return console.log('Error opening port: ', err.message)
        }

        port.write('main screen turn on', function(err) {
            if (err) {
                return console.log('Error on write: ', err.message)
            }
            console.log('message written')
        })
    })

    /*Read 9 length byte data (Data of Axis from KUKA).
    First 4 Bytes are for the number of the axis. 5th Byte is for the sign(positiv, negativ), and the remains are for the axis in degrees.
    */
    //TODO: Check the order of bytes from KUKA (e.g. LITTLE_ENDIAN)
    const parser = port.pipe(new ByteLength({length:9}))

    /*
    * Buffer must be flushed once, because some bytes are already written after opening ports.
    * Auto-open is disabled to set the flush.
    */
    port.on('open', function (){
        port.flush(function (err){
            if(err){
                console.log(err)
            }
        })


        parser.on('data', function (data){
            const dataArray = new Uint8Array(data)
            //let startCalc = performance.now()
            //console.log(dataArray)
            const jsonData = JsonEncoderWasm(dataArray)
            //let endCalc = performance.now()
            //client.publish(calcTopic,(endCalc-startCalc).toString())
            /*let startCalc = performance.now()
            let counter = setAxisData(dataArray)
            let endCalc = performance.now()
            client.publish(calcTopic,(endCalc-startCalc).toString())


            if(counter == 7){
                console.log(getDistance())
                //console.log(isUnsafe())
                console.log(counter)
            }
            else if(counter == -1){
                console.log('Error: Received data is invalid')
            }*/

            if(jsonData.length>1){
                mqtt_publish(jsonData)
            }

        })
    })

}


//MQTT
const mqtt = require('mqtt')
const topic = 'KUKA'
const subTopic = "KUKAAxes/return"
const rttTopic = "RTT"
const calcTopic = "CALC"
const optionJSON = JSON.parse(getMQTTOptions())
const options = {
    clientId:optionJSON.clientId,
    port:optionJSON.port,
    host:optionJSON.host,
    username:optionJSON.username,
    password:optionJSON.password,
    key:KEY,
    cert: CERT,
    ca: TRUSTED_CA_LIST,
    rejectUnauthorized: false,
    protocol: optionJSON.protocol,
    reconnectPeriod:optionJSON.reconnectPeriod
}
const client  = mqtt.connect(options);
// https://www.emqx.io/mqtt/public-mqtt5-broker
//const client = mqtt.connect('mqtt://broker.emqx.io');

//Subscribe the broker
client.on('connect', function () {
    client.subscribe(subTopic, function (err) {
        if (!err) {
            console.log('Connected')
        }
    })
})

//Listening messages from the broker
client.on('message', function (subTopic, message) {
    // message is Buffer
    if(message.toString()==='EndConnection'){
        client.end()
    }
    if(arrivalCounter<MEASURE_TIMES){
        client.publish('RTTEnd',performance.now().toString())
    }
    arrivalCounter++

});

//Display Errors
client.on('error', function(err) {
    console.dir(err)
})

const mqtt_publish = function (msg){

    //Check the connection
    if(!client.connected){
        client.reconnect()
    }
    //client.publish(topic, 'Test: ')
    if(startCounter<MEASURE_TIMES){
        client.publish('RTTStart',performance.now().toString())
    }
    client.publish(topic, msg)
    startCounter++
    //client.publish("Start", performance.now().toString())
}

serial_read()