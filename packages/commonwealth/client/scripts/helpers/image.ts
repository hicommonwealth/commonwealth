export const generateBlobImageFromAlphabet = ({
  letter,
  color = {
    bg: '#757575', // $neutral-500 from color palette - can be hex value or solid color name ex: 'white' or 'black'
    letter: 'white', // can be hex value or solid color name ex: 'white' or 'black'
  },
  imageSize = {
    width: 200,
    height: 200,
  },
}: {
  letter: string; // not adding strong type for this as usecase can vary
  color?: {
    bg: string;
    letter: string;
  };
  imageSize?: {
    width: number;
    height: number;
  };
}): Promise<string> => {
  return new Promise((resolve, reject) => {
    // attempt to create canvas context
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject('failed to get canvas context');
      return;
    }

    // configure canvas size
    canvas.width = imageSize.width;
    canvas.height = imageSize.height;

    // configure canvas background
    ctx.fillStyle = color.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // setup font and write text
    ctx.font = `${Math.floor(Math.floor(imageSize.width + imageSize.height) / 2) / 2}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color.letter;
    ctx.fillText(letter, canvas.width / 2, canvas.height / 2);

    // convert canvas to a Blob url
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        resolve(url);
      } else {
        reject('failed to create blob url from canvas');
      }
    }, 'image/jpeg');
  });
};
