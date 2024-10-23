export function canAcceptFileForImport(file: Pick<File, 'type'>) {
  return ['text/markdown', 'text/plain'].includes(file.type);
}
