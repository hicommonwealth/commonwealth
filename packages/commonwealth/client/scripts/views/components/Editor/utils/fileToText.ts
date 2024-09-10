export function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject('File reading failed.');
      }
    };

    reader.onerror = () => {
      reject('Error reading file.');
    };

    reader.readAsText(file);
  });
}
