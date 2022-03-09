const isValidJSON = async (input: string) => {
  try {
    JSON.parse(input);
  } catch (e) {
    return false;
  }
  return true;
};
export default isValidJSON;
