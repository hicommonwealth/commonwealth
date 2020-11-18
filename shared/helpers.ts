export function urlHasValidHTTPPrefix(url: string) {
  return (url.indexOf('http://') === 0 || url.indexOf('https://') === 0);
}

export function formatToSize(inputTxt: string, size: number) {
  if (inputTxt.length > size) {
    inputTxt = `${inputTxt.substring(0, size - 3)}...`;
  }
  return inputTxt;
}
