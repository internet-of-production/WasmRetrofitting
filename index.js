const fs = require("fs");
const loader = require("@assemblyscript/loader");
const imports = { /* imports go here */ };
const wasmModule = loader.instantiateSync(fs.readFileSync(__dirname + "/build/optimized.wasm"), imports);
module.exports = wasmModule.exports;



const SerialPort = require('serialport');
const ByteLength = require('@serialport/parser-byte-length');

const port = new SerialPort('/dev/cu.usbserial-0001', {
    baudRate: 9600,
    autoOpen: false
})


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

        //TODO: Implement: Just give data to Wasm Module (then, Wasm Module filters bytes).
        parser.on('data', function (data){
            let value=data
            //Slice 1st Byte
            let axisNumber = value.slice(0,1)
            //readUInt converts buffer to uint8
            console.log(axisNumber.readUInt8(0))
        })
    })

}

serial_read()