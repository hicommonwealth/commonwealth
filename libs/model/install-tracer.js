import { readFileSync, readdirSync, statSync } from 'fs';
import { writeFileSync } from 'node:fs';
import { join } from 'path';

function findTsFiles(directory, filesList = []) {
  const files = readdirSync(directory);

  files.forEach((file) => {
    const filePath = join(directory, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively search in subdirectory
      findTsFiles(filePath, filesList);
    } else if (file.endsWith('.ts')) {
      // Add .ts file to the list
      filesList.push(filePath);
    }
  });

  return filesList;
}

function installTracers(path) {
  const buff = readFileSync(path);
  const content = buff.toString('utf8');

  const startTracer = `console.log('LOADING ${path} START');`;
  const endTracer = `console.log('LOADING ${path} END');`;

  const newContent = startTracer + '\n' + content + '\n' + endTracer;

  writeFileSync(path, newContent);
}

const tsFiles = findTsFiles('src');

for (const tsFile of tsFiles) {
  console.log(tsFile);
  installTracers(tsFile);
}
