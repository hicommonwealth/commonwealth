export const validURL = (str) => {
  const pattern = new RegExp('^(https?:\\/\\/)?' // protocol
    + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
    + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
    + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
    + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
    + '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
};

export const urlHasValidHTTPPrefix = (url: string) => {
  return (url.indexOf('http://') === 0 || url.indexOf('https://') === 0);
};

export const preprocessQuillDeltaForRendering = (nodes) => {
  // split up nodes at line boundaries
  const lines = [];
  for (const node of nodes) {
    if (typeof node.insert === 'string') {
      node.insert.match(/[^\n]+\n?|\n/g).forEach((line) => {
        lines.push({ attributes: node.attributes, insert: line });
      });
    } else {
      lines.push(node);
    }
  }
  // group nodes under parents
  const result = [];
  let parent = { children: [], attributes: undefined };
  for (const node of lines) {
    if (typeof node.insert === 'string' && node.insert.endsWith('\n')) {
      parent.attributes = node.attributes;
      // concatenate code-block node parents together, keeping newlines
      if (result.length > 0 && result[result.length - 1].attributes && parent.attributes
                 && parent.attributes['code-block'] && result[result.length - 1].attributes['code-block']) {
        parent.children.push({ insert: node.insert });
        result[result.length - 1].children = result[result.length - 1].children.concat(parent.children);
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
  while (result.length
         && result[result.length - 1].children.length === 1
         && typeof result[result.length - 1].children[0].insert === 'string'
         && result[result.length - 1].children[0].insert === '\n'
         && result[result.length - 1].children[0].attributes === undefined) {
    result.pop();
  }

  return result;
};

export const renderQuillDeltaToText = (delta, paragraphSeparator = '\n\n') => {
  return preprocessQuillDeltaForRendering(delta.ops).map((parent) => {
    return parent.children.map((child) => {
      if (typeof child.insert === 'string') return child.insert.trimRight('\n');
      if (child.insert?.image) return '(image)';
      if (child.insert?.twitter) return '(tweet)';
      if (child.insert?.video) return '(video)';
      return '';
    }).filter((child) => !!child).join(' ').replace(/  +/g, ' '); // remove multiple spaces
  }).filter((parent) => !!parent).join(paragraphSeparator);
};
