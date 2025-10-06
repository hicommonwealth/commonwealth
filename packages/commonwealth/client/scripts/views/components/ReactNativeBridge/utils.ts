export function messageToObject(message: string | object): object | null {
  try {
    return typeof message === 'string' ? JSON.parse(message) : message;
  } catch (e) {
    // this could happen if another library is sending non-JSON data via
    // postMessage
    return null;
  }
}
