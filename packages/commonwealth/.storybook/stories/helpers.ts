interface ArgsObject {
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

export const objectArrayToArgs = (
  arr: any[],
  objProperty: string,
  controlLabel: string,
) => {
  let obj: ArgsObject = {};

  for (let i: number = 0; i < arr.length; i++) {
    let property = controlLabel + " " + (i+1);
    obj[property] = arr[i][objProperty];
  }

  return obj;
}

export function argsToOptions<T>(
  args: any,
  propertyA: string,
  propertyB: string
): T[] {
  let arr: T[] = [];

  Object.values(args).map((option: any) => {
    let obj: any = {}
    obj[propertyA] = option as string;
    obj[propertyB] = option;
    arr.push(obj);
  });
  
  return arr;
}
