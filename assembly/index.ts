//Create a static array for data
let axisData = new Uint8Array(1024);
//The length of axis data is 9 bytes
const AXIS_DATA_LENGTH = 9;



export function add(a: i32, b: i32): i32 {
  return a + b;
}

//It counts the number of data of Axis 1.
//1st byte is the id of axes.
export function countFirstAxisData(numberOfData:i32):i32{
  let counter:i32 = 0;
  for(let i:i32 = 0; i<numberOfData*AXIS_DATA_LENGTH; i=i+AXIS_DATA_LENGTH){

    //load data from the shared memory, and check the value
    if(load<u8>(i)==1){
      counter++;
    }
  }

  return counter;
}