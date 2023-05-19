export interface ArgsObject {
  [key: string]: string;
}

export const argsObj = (controlLabel: string, arr: string[]) => {
  let obj: ArgsObject = {};

  for (let i: number = 0; i < arr.length; i++) {
    let attribute = controlLabel + " " + (i+1);
    obj[attribute] = arr[i];
  }

  return obj;
}
