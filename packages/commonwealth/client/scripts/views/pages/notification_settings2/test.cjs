const fs = require('fs');

const data = fs.readFileSync('example2.json');
const content = data.toString('utf-8');
const json = JSON.parse(content);

for (const record of json.result) {
  if (record.Thread && !record.Community) {
    console.log('missing community.');
  } else {
    console.log('works.');
  }
}
