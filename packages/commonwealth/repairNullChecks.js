import fs from 'fs';

async function repairNullChecks(path, lineNr, columnNr) {
  // TODO make this idempotent so that if the char at the given position is ALREADY '!' then abort

  const buff = fs.readFileSync(path);
  const content = buff.toString('utf-8');

  const lines = content.split('\n');
  const line = lines[lineNr - 1];

  if (line[columnNr] === '!') {
    console.log(`Skipping: ${path}:${lineNr}:${columnNr}`);
  }

  const lineArr = line.split('');
  lineArr.splice(columnNr, 0, '!');
  const lineFixed = lineArr.join('');
  const newLines = [...lines];
  newLines[lineNr - 1] = lineFixed;

  console.log(`line: '${line}'`);
  console.log(`lineFixed: '${lineFixed}'`);

  const newContent = newLines.join('\n');
  fs.writeFileSync(path, Buffer.from(newContent));

  console.log(`Applied: ${path}:${lineNr}:${columnNr}`);
}

// 2728 before

repairNullChecks('test/util/modelUtils.ts', 618, 19).catch(console.error);
