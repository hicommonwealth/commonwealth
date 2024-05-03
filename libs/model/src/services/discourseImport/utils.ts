import bip39 from 'bip39';
import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore-line
import cosmos from 'cosmos-lib'; // TODO: add lib types?

export const renderQuillDeltaToText = (
  delta: { ops: any[] },
  paragraphSeparator = '\n\n',
) => {
  return preprocessQuillDeltaForRendering(delta.ops)
    .map((parent) => {
      return parent.children
        .map((child: any) => {
          if (typeof child.insert === 'string')
            return child.insert.trimRight('\n');
          if (child.insert?.image) return '(image)';
          if (child.insert?.twitter) return '(tweet)';
          if (child.insert?.video) return '(video)';
          return '';
        })
        .filter((child: any) => !!child)
        .join(' ')
        .replace(/  +/g, ' '); // remove multiple spaces
    })
    .filter((parent) => !!parent)
    .join(paragraphSeparator);
};

export const preprocessQuillDeltaForRendering = (nodes: any[]) => {
  // split up nodes at line boundaries
  const lines: any[] = [];
  for (const node of nodes) {
    if (typeof node.insert === 'string') {
      const matches = node.insert.match(/[^\n]+\n?|\n/g);
      (matches || []).forEach((line: any) => {
        lines.push({ attributes: node.attributes, insert: line });
      });
    } else {
      lines.push(node);
    }
  }
  // group nodes under parents
  const result: any[] = [];
  let parent = { children: [], attributes: undefined } as {
    children: any[];
    attributes: any;
  };
  for (const node of lines) {
    if (typeof node.insert === 'string' && node.insert.endsWith('\n')) {
      parent.attributes = node.attributes;
      // concatenate code-block node parents together, keeping newlines
      if (
        result.length > 0 &&
        result[result.length - 1].attributes &&
        parent.attributes &&
        parent.attributes['code-block'] &&
        result[result.length - 1].attributes['code-block']
      ) {
        parent.children.push({ insert: node.insert });
        result[result.length - 1].children = result[
          result.length - 1
        ].children.concat(parent.children);
      } else {
        parent.children.push({ insert: node.insert });
        result.push(parent);
      }
      parent = { children: [], attributes: undefined };
    } else {
      parent.children.push(node);
    }
  }
  // If there was no \n at the end of the document, we need to push whatever remains in `parent`
  // onto the result. This may happen if we are rendering a truncated Quill document
  if (parent.children.length > 0) {
    result.push(parent);
  }

  // trim empty newlines at end of document
  while (
    result.length &&
    result[result.length - 1].children.length === 1 &&
    typeof result[result.length - 1].children[0].insert === 'string' &&
    result[result.length - 1].children[0].insert === '\n' &&
    result[result.length - 1].children[0].attributes === undefined
  ) {
    result.pop();
  }
  return result;
};

export const createCosmosAddress = () => {
  const MNEMONIC = bip39.generateMnemonic();
  const keys = cosmos.crypto.getKeysFromMnemonic(MNEMONIC);
  return cosmos.address.getAddress(keys.publicKey);
};

export const base64Encode = (file: string) => {
  const bitmap = fs.readFileSync(file);
  return Buffer.from(bitmap).toString('base64');
};
