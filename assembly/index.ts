import { JSONEncoder } from "assemblyscript-json";
import {calcDistance, isCollisionDetected,getTip} from "./collision-detection";

//Create a static array for data
let axisData = new Uint8Array(1024);
//The length of axis data is 9 bytes
const AXIS_DATA_LENGTH = 9;
const AXIS_NUMBER_LENGTH = 4;
const INVALID_VALUE:f64 = 1000000;
const ALL_DATA_PRESENT = 7;
const INVALID_DATA_SIGN = -1;
//values of axis
let axesArray:Array<f64> = [0,0,0,0,0,0,0]
let jsonArray:Array<f64> = [0,0,0,0,0,0,0]
let axesDataCounter = 0
let axesJsonCounter = 0
let storeDistance:f64 = 0
let errorFreeJson:bool = true
let errorFreeData:bool = true
const emptyUint8Array = new Uint8Array(1)

let mqttOptionJSON:string = "{\"clientId\":\"wasmNode\",\"port\":1883,\"host\":\"localhost\",\"username\":\"wasmretrofitting\",\"password\":\"wasmretrofitting\",\"protocol\": \"mqtt\",\"reconnectPeriod\":1000}"

export function getMQTTOptions():string{
  return mqttOptionJSON
}

//KRC2 sends bytes in the little endian
function convertNumber(dataArray:Uint8Array,offset:i32):i32{
  let convertedValue:i32=0
  for(let i:i32 = AXIS_NUMBER_LENGTH+offset-1; i>=offset;i--){
    convertedValue = (convertedValue<<8) + dataArray[i]
  }

  return  convertedValue;
}


function isAxisValueValid(number:i32, value:f64):bool{

  switch (number) {
    case 1:
      return (-185<=value && value<=185);
    case 2:
      return (-146<=value && value<=0);
    case 3:
      return (-119<=value && value<=155);
    case 4:
      return (-350<=value && value<=350);
    case 5:
      return (-125<=value && value<=125);
    case 6:
      return (-350<=value && value<=350);
    case 7: //TODO: Add checking external axis (linear, 7th axis)
      return true;
    default: {
      return false;
    }
  }
}


//1st byte is the id of axes. It returns the value in the JSON format.
export function JsonEncoderWasm(dataArray:Uint8Array):Uint8Array{

  axesJsonCounter++

  if(!errorFreeJson){
    if(axesJsonCounter == 7){
      axesJsonCounter = 0
      errorFreeJson = true
    }
    return emptyUint8Array
  }

  let axisNumber:i32 = convertNumber(dataArray,0)
  let axisValue:f64 = convertNumber(dataArray,5)/ 100000.0
  //let axisValue:f64 = convertNumber(dataArray,5)

  if(axisNumber<1 || axisNumber>7 || !isAxisValueValid(axisNumber,axisValue)){

    if(axesJsonCounter == 7){
      axesJsonCounter = 0
    }
    else{
      errorFreeJson = false
    }
    return emptyUint8Array
  }
  else{
    if(axesJsonCounter != 7){
      jsonArray[axisNumber-1] = axisValue
      return emptyUint8Array
    }
    else{
      jsonArray[axisNumber-1] = axisValue

      let jsonEncoder = new JSONEncoder()
      jsonEncoder.pushObject(null)
      for(let i=0; i<jsonArray.length; i++){
        jsonEncoder.setString("axis_"+(i+1).toString(),jsonArray[i].toString())
      }
      jsonEncoder.popObject()

      axesJsonCounter=0
      let result:Uint8Array = jsonEncoder.serialize()
      return result
    }
  }

}


/*
  Reverse positive and negative angles to copy them in coordinate system.
  It assumes that the robot's base stands on the ground, and the initial position of the tip is positive (on the x-y plane).
  Therefore, the clockwise rotation is negative, the counterclockwise is positive, but KUKA robots outputs the opposite
  */
export function setAxisData(dataArray:Uint8Array):i32{

  axesDataCounter++

  if(!errorFreeData){
    if(axesDataCounter == 7){
      axesDataCounter = 0
      errorFreeData = true
      return INVALID_DATA_SIGN
    }
    else{
      return axesDataCounter
    }
  }

  let axisNumber:i32 = convertNumber(dataArray,0)
  let axisValue:f64 = convertNumber(dataArray,5)/ 100000.0
  //let axisValue:f64 = convertNumber(dataArray,5) //For Test


  if(axisNumber<1 || axisNumber>7 || !isAxisValueValid(axisNumber,axisValue)){

    if(axesDataCounter == 7){
      axesDataCounter = 0
      return INVALID_DATA_SIGN
    }
    else{
      errorFreeData = false
      return axesDataCounter
    }

  }
  else{
    if(axesDataCounter != 7){
      axesArray[axisNumber-1] = - axisValue
      return axesDataCounter
    }
    else{
      axesArray[axisNumber-1] = axisValue
      storeDistance = calcDistance(axesArray)
      axesDataCounter = 0
      return ALL_DATA_PRESENT
    }
  }
}

export function getDistance():f64{
  return storeDistance
}

export function isUnsafe():bool{
  return isCollisionDetected()
}

export function getTipCoordinate():f64{
  return getTip()
}