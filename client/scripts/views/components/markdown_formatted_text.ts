/* eslint-disable no-useless-escape */
import 'components/markdown_formatted_text.scss';

import $ from 'jquery';
import m from 'mithril';

// Three-pass Markdown formatter.
//
// 1. Whitespace-preserving formatters are applied. The only one right
// now is triple backticks for code blocks (```)
//
// 2. Block formatters are applied to groups of text, such as
// paragraphs and code blocks, that may span multiple lines. Block
// formatters may insert block-level tags like <ul> and/or line-level
// tags like <li>.
//
// Supported styles: H1, H2, H3, blockquote, unordered list, code
// block (indented two spaces)
//
// 3. Inline formatters are applied to the text within each block.
//
// Supported styles: *italic*, **bold**, _italic_, __bold__, `code`,
// ~strike~, [https://example.com/image], https://example.com/link,
// [link](https://example.com/link)
//
// Parentheses are not allowed in URLs, but [brackets] are.
//
// Setting the hideFormatting option causes all text to be rendered on
// a single line as <span>s without formatting, with <pre> blocks
// hidden.

const applyInlineFormatters = (text, hideFormatting) => {
  if (!text) return '';
  const result = [];
  let lastMatchEndingIndex = 0;
  let before;
  let after;
  let match;
  const inlineFormatters = [{
    pattern: '\\*\\*(.+?)\\*\\*',
    formatter: (captures) => m('strong', captures[0])
  }, {
    pattern: '(^|\\W)__(.+?)__($|\\W)',
    formatter: (captures) => [captures[0], m('strong', captures[1]), captures[2]]
  }, {
    pattern: '\\*(.+?)\\*',
    formatter: (captures) => m('em', captures[0]),
  }, {
    pattern: '(^|\\W)_(.+?)_($|\\W)',
    formatter: (captures) => [captures[0], m('em', captures[1]), captures[2]],
  }, {
    pattern: '`(.+?)`',
    formatter: (captures) => m('code', captures[0])
  }, {
    pattern: '~(.+?)~',
    formatter: (captures) => m('s', captures[0])
  }, {
    pattern: '\\[(.+?)\\]\\((.+?)\\)',
    formatter: (captures) => m('a', { target: '_blank', href: captures[1] }, captures[0] || 'Link'),
  }, {
    pattern: '\\[(https?:\\/\\/[\\w|\\.\\;\\/\\?\\:\\@\\=\\&\\%\\"\\<\\>\\#\\{\\}\\|\\~\\[\\]\\\'\\*\\+\\,\\-\\!]+)\\]',
    formatter: (captures) => m('img', { src: captures[0] })
  }, {
    pattern: '(https?:\\/\\/[\\w|\\.\\;\\/\\?\\:\\@\\=\\&\\%\\"\\<\\>\\#\\{\\}\\|\\~\\[\\]\\\'\\*\\+\\,\\-\\!]+)',
    formatter: (captures) => m('a', { target: '_blank', href: captures[0] }, captures[0])
  }];
  const regexp = new RegExp(inlineFormatters.map((p) => p.pattern).join('|'), 'g');

  while (true) {
    // isolate the next match, and any unprocessed text before/after it
    match = regexp.exec(text);
    if (match === null) {
      after = text.slice(lastMatchEndingIndex);
      break;
    }
    before = text.slice(lastMatchEndingIndex, match.index);
    after = text.slice(match.index + match[0].length);
    // push any unprocessed text before the match
    if (result.length === 0 || match.index > lastMatchEndingIndex) {
      result.push(before);
    }
    lastMatchEndingIndex = match.index + match[0].length;
    // check which exact pattern was matched, and push the matched text
    for (const inlineFormatter of inlineFormatters) {
      const matched = match[0].match(inlineFormatter.pattern);
      // eslint-disable-next-line
      if (!matched) continue;
      if (matched.length < 2) {
        console.error('RegExp got empty match content - this should never happen:', match[0]);
      } else {
        result.push(hideFormatting ? matched.slice(1) : inlineFormatter.formatter(matched.slice(1)));
        break;
      }
    }
    if (match.done) break;
  }
  // push any remaining unprocessed text
  result.push(after);
  return result;
};

function applyBlockFormatters(parentText, hideFormatting) {
  const sections = parentText.split('\n\n');
  return sections.map((section) => {
    const lines = section.split('\n')
      .filter((p) => !!p.trim())
      .map((p) => p.trimRight());

    const blockFormatters = [{
      pattern: /^# /,
      formatMany: (text) => m(hideFormatting ? 'div' : 'h1', text),
      formatOne: (text, match) => hideFormatting
        ? [] : m('div', applyInlineFormatters(text.replace(match, ''), hideFormatting)),
    }, {
      pattern: /^## /,
      formatMany: (text) => m(hideFormatting ? 'div' : 'h2', text),
      formatOne: (text, match) => hideFormatting
        ? [] : m('div', applyInlineFormatters(text.replace(match, ''), hideFormatting)),
    }, {
      pattern: /^### /,
      formatMany: (text) => m(hideFormatting ? 'div' : 'h3', text),
      formatOne: (text, match) => hideFormatting
        ? [] : m('div', applyInlineFormatters(text.replace(match, ''), hideFormatting)),
    }, {
      pattern: /^> /,
      formatMany: (text) => m(hideFormatting ? 'div' : 'blockquote', text),
      formatOne: (text, match) => hideFormatting
        ? [] : m('div', applyInlineFormatters(text.replace(match, ''), hideFormatting)),
    }, {
      pattern: /^(- |\* |• |· )/,
      formatMany: (text) => m(hideFormatting ? 'div' : 'ul', text),
      formatOne: (text, match) => hideFormatting
        ? [] : m('li', applyInlineFormatters(text.replace(match, ''), hideFormatting)),
    }, {
      pattern: /^ {1,2}(- |\* |• |· )/,
      formatMany: (text) => m(hideFormatting ? 'div' : 'ul', m('ul', text)),
      formatOne: (text, match) => hideFormatting
        ? [] : m('li', applyInlineFormatters(text.replace(match, ''), hideFormatting)),
    }, {
      pattern: /^ {3,4}(- |\* |• |· )/,
      formatMany: (text) => m(hideFormatting ? 'div' : 'ul', m('ul', m('ul', text))),
      formatOne: (text, match) => hideFormatting
        ? [] : m('li', applyInlineFormatters(text.replace(match, ''), hideFormatting)),
    }, {
      pattern: /^ {5,}(- |\* |• |· )/,
      formatMany: (text) => m(hideFormatting ? 'div' : 'ul', m('ul', m('ul', m('ul', (text))))),
      formatOne: (text, match) => hideFormatting
        ? [] : m('li', applyInlineFormatters(text.replace(match, ''), hideFormatting)),
    }, {
      pattern: /^\[([ x])\] /,
      formatMany: (text) => m(hideFormatting ? 'div' : 'ul.checklist', text),
      formatOne: (text, match) => hideFormatting
        ? []
        : m(`li${match.includes('x') ? '.checked' : '.unchecked'}`, [
          m('span', applyInlineFormatters(text.replace(match, ''), hideFormatting))
        ]),
    }];

    // Lines which don't match any of the above groups are assigned an
    // undefined index, blockFormatters[lastLineFormat] === undefined,
    // and will be formatted using `defaultGroup`. See the
    // special-casing code further down.
    const defaultGroup = (children) => {
      return m('div', children.map((text) => {
        return m('div', applyInlineFormatters(text, hideFormatting));
      }));
    };

    let lastLineFormat;
    let lastGroup = [];
    const results = [];
    lines.forEach((line: string, index: number) => {
      let thisLineFormat;
      let match;
      for (let i = 0; i < blockFormatters.length; i++) {
        match = line.match(blockFormatters[i].pattern);
        if (match) {
          thisLineFormat = i;
          break;
        }
      }
      if (thisLineFormat === lastLineFormat) {
        // if we are in the same group, keep appending to it
        lastGroup.push(
          (blockFormatters[thisLineFormat])
            ? blockFormatters[thisLineFormat].formatOne(line, match[0]) : `${line} `
        );
      } else {
        // otherwise, push the previous group onto `results` and start anew
        results.push(
          (blockFormatters[lastLineFormat])
            ? blockFormatters[lastLineFormat].formatMany(lastGroup)
            : defaultGroup(lastGroup)
        );
        lastLineFormat = thisLineFormat;
        lastGroup = [
          (blockFormatters[thisLineFormat])
            ? blockFormatters[thisLineFormat].formatOne(line, match[0])
            : `${line} `
        ];
      }
    });
    // push the last group onto `results`
    if (lastGroup.length > 0) {
      results.push(
        (blockFormatters[lastLineFormat])
          ? blockFormatters[lastLineFormat].formatMany(lastGroup)
          : defaultGroup(lastGroup)
      );
    }
    return results;
  });
}

const MarkdownFormattedText : m.Component<{ doc: string, hideFormatting?: boolean, collapse?: boolean }> = {
  view: (vnode) => {
    const { doc, hideFormatting, collapse } = vnode.attrs;
    if (!doc) return;

    const results = [];
    const codeBlockRegex = /```((?:.|\n)*?)```/gm;
    let lastMatchEndingIndex = 0;

    // Break up the document into code blocks and everything else, and
    // then render the resulting chunks
    while (true) {
      const match = codeBlockRegex.exec(doc);
      if (!match) break;
      // TODO: use match.groups?
      const matchContent = match.length > 1 ? match[1] : match[0];
      if (match.index > lastMatchEndingIndex) {
        results.push(
          applyBlockFormatters(
            doc.slice(lastMatchEndingIndex, match.index), hideFormatting
          )
        );
      }
      if (!hideFormatting) results.push(m('pre', matchContent.replace(/^\s+|\s+$/g, '')));
      lastMatchEndingIndex = match.index + match[0].length;
    }
    results.push(applyBlockFormatters(doc.slice(lastMatchEndingIndex), hideFormatting));
    return m('.MarkdownFormattedText', results);
  }
};

export default MarkdownFormattedText;
