/**
 * Save the content locally and use the `filename` as the suggested name for the
 * file.
 */
export function downloadDataAsFile(
  content: string,
  type: string,
  filename: string,
) {
  const blob = new Blob([content], { type });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(link.href);
}
