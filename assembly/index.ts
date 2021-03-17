import { JSONEncoder } from "assemblyscript-json";

//Create a static array for data
let axisData = new Uint8Array(1024);
//The length of axis data is 9 bytes
const AXIS_DATA_LENGTH = 9;
const AXIS_NUMBER_LENGTH = 4;
let countAxis1:i32 = 0;


export function add(a: i32, b: i32): i32 {
  return a + b;
}

//It counts the number of data of Axis 1.
//1st byte is the id of axes.
/*
export function countFirstAxisData(numberOfData:i32):string{
  let counter:i32 = 0;
  for(let i:i32 = 0; i<numberOfData*AXIS_DATA_LENGTH; i=i+AXIS_DATA_LENGTH){

    //load data from the shared memory, and check the value
    if(load<u8>(i)==1){
      counter++;
    }
  }

  let result:string = "{" + counter.toString() + "}"

  return result;
}*/


//Robot sends bytes in the little endian
function convertNumber(dataArray:Uint8Array,offset:i32):i32{
  let convertedValue:i32=0
  for(let i:i32 = AXIS_NUMBER_LENGTH+offset-1; i>=offset;i--){
    convertedValue = (convertedValue<<8) + dataArray[i]
  }

  return  convertedValue;
}

//1st byte is the id of axes. It returns the value in the JSON format.
export function JsonEncoderWasm(dataArray:Uint8Array):Uint8Array{

  let axisNumber:i32 = convertNumber(dataArray,0)
  let axisValue:f64 = convertNumber(dataArray,5)/ 100000.0

  if(axisNumber<0 || axisNumber>7){
    let errorArray:Uint8Array = new Uint8Array(1)
    return errorArray
  }

  // Create encoder
  let encoder = new JSONEncoder()

  encoder.pushObject(null);
  encoder.setString("axis_number", axisNumber.toString())
  encoder.setString("axis_value",axisValue.toString())
  encoder.popObject()
  let result:Uint8Array = encoder.serialize()
  return result
}