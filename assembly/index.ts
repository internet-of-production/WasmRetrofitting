import { JSONEncoder } from "assemblyscript-json";
import {calcDistance, getDistance, isCollisionDetected,getTip} from "./collision-detection";

//Create a static array for data
let axisData = new Uint8Array(1024);
//The length of axis data is 9 bytes
const AXIS_DATA_LENGTH = 9;
const AXIS_NUMBER_LENGTH = 4;
//values of axis
let axesArray:Array<f64> = [0,0,0,0,0,0,0,0]
let degree=0


export function add(a: i32, b: i32): i32 {
  return a + b;
}


//Robot sends bytes in the little endian
function convertNumber(dataArray:Uint8Array,offset:i32):i32{
  let convertedValue:i32=0
  for(let i:i32 = AXIS_NUMBER_LENGTH+offset-1; i>=offset;i--){
    convertedValue = (convertedValue<<8) + dataArray[i]
  }

  return  convertedValue;
}

//TODO:Check the sign of minus (or plus) values. According to a previous thesis, 32 means positive.
function isPositive(dataArray:Uint8Array):bool{
  if(dataArray[4]==32){
    return true
  }
  return false
}

//1st byte is the id of axes. It returns the value in the JSON format.
export function JsonEncoderWasm(dataArray:Uint8Array):Uint8Array{

  let axisNumber:i32 = convertNumber(dataArray,0)
  //let axisValue:f64 = convertNumber(dataArray,5)/ 100000.0
  let axisValue:f64 = convertNumber(dataArray,5)

  if(!isPositive(dataArray)){
      axisValue = -axisValue
  }
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

export function JsonEncoderString(dataArray:Uint8Array):string{

  let axisNumber:i32 = convertNumber(dataArray,0)
  //let axisValue:f64 = convertNumber(dataArray,5)/ 100000.0
  let axisValue:f64 = convertNumber(dataArray,5)

  if(!isPositive(dataArray)){
    axisValue = -axisValue
  }
  if(axisNumber<0 || axisNumber>7){
    let errorArray:Uint8Array = new Uint8Array(1)
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
}

export function setAxisData(dataArray:Uint8Array):i32{

  let axisNumber:i32 = convertNumber(dataArray,0)
  //let axisValue:f64 = convertNumber(dataArray,5)/ 100000.0
  let axisValue:f64 = convertNumber(dataArray,5)

  /*
  Reverse positive and negative angles to copy them in coordinate system.
  It assumes that the robot's base stands on the ground, and the initial position of the tip is positive (on the x-y plane).
  Therefore, the clockwise rotation is negative, the counterclockwise is positive, but KUKA robots outputs the opposite
  */
  if(isPositive(dataArray)){
    if(axisValue!=0){
      axisValue = -axisValue
    }
  }

  if(axisNumber<0 || axisNumber>7){
    return 0;
  }
  else if(axisNumber==7){
//TODO: クラスAxisを使うとおそらくArduinoでエラーが出るので二次元配列で表現した方がいいかもしれない。
//TODO: ここでAxis7が入ってきたら距離計算を呼び出す。JS側は7が返されたら計算が完了したと判断してゲッターを呼び出す。あるいはダイレクトに距離を返したいが、関数の役割をある程度はっきりさせたい
    axesArray[axisNumber-1] = axisValue
    calcDistance(axesArray)
    degree = dataArray[3]
  }
  else{
    axesArray[axisNumber-1] = axisValue
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