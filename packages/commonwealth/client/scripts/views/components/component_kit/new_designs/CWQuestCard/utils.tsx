export function addPeriodToText(text: string): string {
  return text[text.length - 1] === '.' ? text : `${text}.`;
}
