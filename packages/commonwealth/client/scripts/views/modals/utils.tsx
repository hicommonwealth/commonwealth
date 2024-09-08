export const markdownImageRegex = /!\[image\]\((.*?)\)/;

export const removeImageMarkdown = (desc) => {
  return desc.replace(markdownImageRegex, '').trim();
};

//checks if there is an image in the topic description to delete separately in the modal
export const checkForImageInDescription = (description, setImage) => {
  if (!description || typeof description !== 'string') {
    setImage(null);
    return;
  }
  const match = description.match(markdownImageRegex);
  setImage(match ? match[1] : null);
};
