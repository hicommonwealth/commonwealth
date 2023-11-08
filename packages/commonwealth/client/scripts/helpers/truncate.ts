export const truncate = (
  str: string,
  maxCharLength = 140,
  ellipsisPadding = 4
): string => {
  // Get the available width of the container or the window
  const availableWidth = window.innerWidth;

  // Define the maximum allowed width as half of the available width
  const maxWidth = 0.5 * availableWidth;

  // Check if the string is longer than the specified maximum length or
  // if the available width is less than the maximum width
  if (str.length > maxCharLength || availableWidth < maxWidth) {
    // Calculate the width of the ellipsis
    const ellipsisWidth = '...'.length * ellipsisPadding;

    //Allow for a little more space for the ellipsis to prevent too much whitespace
    const lengthModifier = availableWidth < maxWidth ? 8 : 3;

    // Calculate the maximum truncated length based on the available width and ellipsis width
    const truncatedLength = Math.floor(
      (maxWidth - ellipsisWidth) / lengthModifier
    );

    return str.substring(0, truncatedLength) + '...';
  }

  return str;
};
