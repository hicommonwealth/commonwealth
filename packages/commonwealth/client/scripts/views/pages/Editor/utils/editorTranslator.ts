export function editorTranslator(
  key: string,
  defaultValue: string,
  interpolations: Record<string, any> | undefined,
): string {
  switch (key) {
    case 'toolbar.blockTypeSelect.placeholder':
      // show the default placeholder that's active here.
      return 'H1';
    case 'toolbar.blockTypes.heading':
      if (interpolations?.level) {
        return `H${interpolations.level}`;
      }
      return 'H1';
    case 'toolbar.blockTypes.quote':
      return 'Q';
    case 'toolbar.blockTypes.paragraph':
      return 'P';
    default:
      return defaultValue;
  }
}
