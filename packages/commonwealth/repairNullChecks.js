import fs from 'fs';

/*

To run this do the following:

- First record the errors as file and line numbers

npx tsc > /tmp/raw-errors.txt
cat /tmp/raw-errors.txt |grep -Eo "^(client|server|test|script|shared)/.*\.tsx\([0-9]+,[0-9]+)" > /tmp/errors.txt

- Then run this script, and it will parse out the errors and repair all th files.

- For tsx repair you have to use a use a string of <StrictNullChecks/> then manually repair the errors where that fails.

TODO:
  .ts files for scripts and shared and one for test

 */

const DISABLE_COMMENT = '// @ts-expect-error <StrictNullChecks>';

function getWhitespacePrefix(line) {
  const match = line.match(/^\s*/);
  return match ? match[0] : '';
}

function repairNullChecks(path, lineNr, columnNr) {
  // TODO make this idempotent so that if the char at the given position is ALREADY '!' then abort

  const buff = fs.readFileSync(path);
  const content = buff.toString('utf-8');

  const lines = content.split('\n');
  const line = lines[lineNr - 1];

  if (line.indexOf('@ts-expect-error') !== -1) {
    console.log(`Skipped: ${path}:${lineNr}:${columnNr}`);
    return;
  }

  // get the whitespace prefix...
  const whitespacePrefix = getWhitespacePrefix(line);

  let newLines = [...lines];
  newLines.splice(lineNr - 1, 0, whitespacePrefix + DISABLE_COMMENT);

  const newContent = newLines.join('\n');
  fs.writeFileSync(path, Buffer.from(newContent));

  console.log(`Applied: ${path}:${lineNr}:${columnNr}`);
}

function parseError(line) {
  if (!line) {
    throw new Error('No line');
  }

  // Regular expression to match the pattern
  const regex = /^(.*)\((\d+),(\d+)\)$/;
  const match = line.match(regex);

  if (match) {
    // Extract file, line number, and column number from the match
    const file = match[1];
    const lineNumber = parseInt(match[2], 10);
    const columnNumber = parseInt(match[3], 10);

    // Return the parsed values in an object
    return {
      file: file,
      lineNumber: lineNumber,
      columnNumber: columnNumber,
    };
  } else {
    // If the input does not match the expected pattern, return null or throw an error
    throw new Error('Invalid input format: ' + line);
  }
}
function parseCompilationErrors() {
  const buff = fs.readFileSync('/tmp/errors.txt');
  const content = buff.toString('utf-8');

  const lines = content.split('\n').filter((current) => !!current);

  return lines.map(parseError);
}

const compilationErrors = parseCompilationErrors();

function buildCompilationErrorsPerFile() {
  const result = {};

  for (const c of compilationErrors) {
    if (!result[c.file]) {
      result[c.file] = [];
    }

    result[c.file].push(c);
  }

  return result;
}

/**
 * Sort last line first
 */
function sortCompilationErrorsPerFile(compilationErrorsPerFile) {
  const result = { ...compilationErrorsPerFile };

  for (const key of Object.keys(compilationErrorsPerFile)) {
    const val = compilationErrorsPerFile[key];
    result[key] = val.sort((a, b) => b.lineNumber - a.lineNumber);
  }

  return result;
}

const compilationErrorsPerFile = buildCompilationErrorsPerFile();
const compilationErrorsPerFileSorted = sortCompilationErrorsPerFile(
  compilationErrorsPerFile,
);

for (const key of Object.keys(compilationErrorsPerFileSorted)) {
  const entries = compilationErrorsPerFileSorted[key];

  for (const entry of entries) {
    repairNullChecks(entry.file, entry.lineNumber, entry.columnNumber);
  }
}
