/* eslint-disable no-useless-escape */
import 'components/markdown_formatted_text.scss';

import $ from 'jquery';
import m from 'mithril';
import DOMPurify from 'dompurify';
import { findAll } from 'highlight-words-core';
import smartTruncate from 'smart-truncate';
import { marked } from 'marked';

const renderer = new marked.Renderer();

marked.setOptions({
  renderer,
  gfm: true, // use github flavored markdown
  smartypants: true,
  smartLists: true,
  xhtml: true,
});

const MarkdownFormattedText: m.Component<
  {
    doc: string;
    hideFormatting?: boolean;
    collapse?: boolean;
    searchTerm?: string;
    openLinksInNewTab?: boolean;
    cutoffText?: number;
  },
  {
    cachedDocWithHighlights: string;
    cachedResultWithHighlights;
  }
> = {
  view: (vnode) => {
    const {
      doc,
      hideFormatting,
      collapse,
      searchTerm,
      openLinksInNewTab,
      cutoffText,
    } = vnode.attrs;
    if (!doc) return;
    renderer.link = (href, title, text) => {
      return `<a ${
        href.indexOf('://commonwealth.im/') !== -1 && 'target="_blank"'
      } ${
        openLinksInNewTab ? 'target="_blank"' : ''
      } href="${href}">${text}</a>`;
    };

    // if we're showing highlighted search terms, render the doc once, and cache the result
    if (searchTerm) {
      // TODO: Switch trim system to match QFT component
      if (JSON.stringify(doc) !== vnode.state.cachedDocWithHighlights) {
        const unsanitized = marked.parse(doc.toString());
        const sanitized = DOMPurify.sanitize(unsanitized, {
          ALLOWED_TAGS: ['a'],
          ADD_ATTR: ['target'],
        });
        const vnodes = m.trust(sanitized);
        const root = document.createElement('div');
        m.render(root, vnodes);
        const textToHighlight = root.innerText
          .replace(/\n/g, ' ')
          .replace(/\ +/g, ' ');
        const chunks = findAll({
          searchWords: [searchTerm.trim()],
          textToHighlight,
        });
        vnode.state.cachedDocWithHighlights = JSON.stringify(doc);
        vnode.state.cachedResultWithHighlights = chunks.map(
          ({ end, highlight, start }, index) => {
            const middle = 15;
            const subString = textToHighlight.substr(start, end - start);
            let text = smartTruncate(
              subString,
              chunks.length <= 1 ? 150 : 40 + searchTerm.trim().length,
              chunks.length <= 1
                ? {}
                : index === 0
                ? { position: 0 }
                : index === chunks.length - 1
                ? {}
                : { position: middle }
            );
            if (subString[subString.length - 1] === ' ') {
              text += ' ';
            }
            if (subString[0] === ' ') {
              text = ` ${text}`;
            }
            return highlight ? m('mark', text) : m('span', text);
          }
        );
      }
      return m(
        '.MarkdownFormattedText',
        {
          class: collapse ? 'collapsed' : '',
        },
        vnode.state.cachedResultWithHighlights
      );
    }

    let truncatedDoc = doc;
    if (cutoffText)
      truncatedDoc = doc.slice(
        0,
        doc.split('\n', cutoffText).join('\n').length
      );
    const unsanitized = marked.parse(truncatedDoc.toString());
    const sanitized = hideFormatting
      ? DOMPurify.sanitize(unsanitized, {
          ALLOWED_TAGS: ['a'],
          ADD_ATTR: ['target'],
        })
      : DOMPurify.sanitize(unsanitized, {
          USE_PROFILES: { html: true },
          ADD_ATTR: ['target'],
        });
    const results = m.trust(sanitized);

    return m(
      '.MarkdownFormattedText',
      {
        class: collapse ? 'collapsed' : '',
      },
      results
    );
  },
};

export default MarkdownFormattedText;
