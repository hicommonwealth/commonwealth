/**
 * Creates a buffer object that allows appending data and converting the buffer to a string.
 *
 * @returns {Object} The buffer object.
 * @property {function} append - Appends the provided data to the buffer.
 * @property {function} toString - Converts the buffer to a string.
 */
export function createBuffer() {
  let buff = '';

  function append(data: string) {
    buff += data;
  }

  function toString() {
    return buff;
  }

  return { append, toString };
}
