import fs from 'fs';

const DISABLE_COMMENT = '// @ts-expect-error StrictNullChecks';

function getWhitespacePrefix(line) {
  const match = line.match(/^\s*/);
  return match ? match[0] : '';
}

async function repairNullChecks(path, lineNr, columnNr) {
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

// 2728 before

repairNullChecks('test/util/modelUtils.ts', 618, 19).catch(console.error);
