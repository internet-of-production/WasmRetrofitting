import { JSONEncoder } from "assemblyscript-json";
import {calcDistance, getDistance, isCollisionDetected,getTip} from "./collision-detection";

//Create a static array for data
let axisData = new Uint8Array(1024);
//The length of axis data is 9 bytes
const AXIS_DATA_LENGTH = 9;
const AXIS_NUMBER_LENGTH = 4;
const INVALID_AXIS_VALUE:f64 = 1000000;
const DUMMY_AXIS_NUMBER = 1;
//values of axis
let axesArray:Array<f64> = [0,0,0,0,0,0,0,0]


export function add(a: i32, b: i32): i32 {
  return a + b;
}


//KRC2 sends bytes in the little endian
function convertNumber(dataArray:Uint8Array,offset:i32):i32{
  let convertedValue:i32=0
  for(let i:i32 = AXIS_NUMBER_LENGTH+offset-1; i>=offset;i--){
    convertedValue = (convertedValue<<8) + dataArray[i]
  }

  return  convertedValue;
}


function checkAxisValue(number:i32, value:f64):bool{

  let isValid = false;
  switch (number) {
    case 1:
      isValid = (-185<=value && value<=185);
      break;
    case 2:
      isValid = (-146<=value && value<=0);
      break;
    case 3:
      isValid = (-119<=value && value<=155);
      break;
    case 4:
      isValid = (-350<=value && value<=350);
      break;
    case 5:
      isValid = (-125<=value && value<=125);
      break;
    case 6:
      isValid = (-350<=value && value<=350);
      break;
    case 7: //TODO: Add checking external axis (linear, 7th axis)
      isValid = true;
      break;
    default: {
      break;
    }
  }

  return isValid;
}

//1st byte is the id of axes. It returns the value in the JSON format.
export function JsonEncoderWasm(dataArray:Uint8Array):Uint8Array{

  let axisNumber:i32 = convertNumber(dataArray,0)
  //let axisValue:f64 = convertNumber(dataArray,5)/ 100000.0
  let axisValue:f64 = convertNumber(dataArray,5)

  if(axisNumber<0 || axisNumber>7){
    let errorArray:Uint8Array = new Uint8Array(1)
    return errorArray
  }

  if(!checkAxisValue(axisNumber,axisValue)){
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

/*export function JsonEncoderString(dataArray:Uint8Array):string{

  let axisNumber:i32 = convertNumber(dataArray,0)
  //let axisValue:f64 = convertNumber(dataArray,5)/ 100000.0
  let axisValue: f64 = convertNumber(dataArray, 5)

  if(axisNumber<0 || axisNumber>7){
    return '0'
  }
  if(!checkAxisValue(axisNumber,axisValue)){
    return '0'
  }

  // Create encoder
  let encoder = new JSONEncoder()

  encoder.pushObject(null);
  encoder.setString("axis_number", axisNumber.toString())
  encoder.setString("axis_value",axisValue.toString())
  encoder.popObject()
  //let result:Uint8Array = encoder.serialize()
  let result:string = encoder.toString()
  return result
}*/

export function setAxisData(dataArray:Uint8Array):i32{

  let axisNumber:i32 = convertNumber(dataArray,0)
  //let axisValue:f64 = convertNumber(dataArray,5)/ 100000.0
  let axisValue:f64 = convertNumber(dataArray,5) //For Test

  if(axisNumber<0 || axisNumber>7){
    axesArray[0] = INVALID_AXIS_VALUE
    return DUMMY_AXIS_NUMBER
  }

  /*
  Reverse positive and negative angles to copy them in coordinate system.
  It assumes that the robot's base stands on the ground, and the initial position of the tip is positive (on the x-y plane).
  Therefore, the clockwise rotation is negative, the counterclockwise is positive, but KUKA robots outputs the opposite
  */
  if(axisNumber != 7){
    if(checkAxisValue(axisNumber,axisValue)){
      axesArray[axisNumber-1] = - axisValue //reverse the sign because of
    }
    else{
      axesArray[0] = INVALID_AXIS_VALUE // Set invalid sign in first array's element.
    }
  }
  else{
    if(checkAxisValue(axisNumber,axisValue) && axesArray[0]!=INVALID_AXIS_VALUE){
      axesArray[axisNumber-1] = axisValue
      calcDistance(axesArray)
    }
    else{
      return 0
    }
  }

  return axisNumber
}

export function distance():f64{
  return getDistance()
}

export function isUnsafe():bool{
  return isCollisionDetected()
}

export function getTipCoordinate():f64{
  return getTip()
}