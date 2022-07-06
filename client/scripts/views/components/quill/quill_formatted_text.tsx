/* @jsx m */

import 'components/quill/quill_formatted_text.scss';

import m from 'mithril';
import { findAll } from 'highlight-words-core';
import smartTruncate from 'smart-truncate';

// import { loadScript } from 'helpers';
import { renderQuillDelta } from './render_quill_delta';
import { getClasses } from '../component_kit/helpers';

type QuillFormattedTextAttrs = {
  collapse?: boolean;
  cutoffText?: number;
  doc;
  hideFormatting?: boolean;
  openLinksInNewTab?: boolean;
  searchTerm?: string;
};

export class QuillFormattedText
  implements m.ClassComponent<QuillFormattedTextAttrs>
{
  // which are private
  cachedDocWithHighlights: string;
  cachedResultWithHighlights;

  view(vnode) {
    const {
      doc,
      hideFormatting,
      collapse,
      searchTerm,
      cutoffText,
      openLinksInNewTab,
    } = vnode.attrs;

    const truncatedDoc = { ...doc };

    if (cutoffText) truncatedDoc.ops = [...doc.ops.slice(0, cutoffText)];

    // if we're showing highlighted search terms, render the doc once, and cache the result
    if (searchTerm) {
      if (JSON.stringify(truncatedDoc) !== this.cachedDocWithHighlights) {
        const vnodes = renderQuillDelta(truncatedDoc, hideFormatting, true); // collapse = true, to inline blocks

        const root = document.createElement('div');

        m.render(root, vnodes);

        const textToHighlight = root.innerText
          .replace(/\n/g, ' ')
          .replace(/\ +/g, ' ');

        const chunks = findAll({
          searchWords: [searchTerm.trim()],
          textToHighlight,
        });

        this.cachedDocWithHighlights = JSON.stringify(truncatedDoc);

        this.cachedResultWithHighlights = chunks.map(
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

      return (
        <div
          class={getClasses<{ collapsed?: boolean }>(
            { collapsed: collapse },
            'QuillFormattedText'
          )}
        >
          {this.cachedResultWithHighlights}
        </div>
      );
    } else {
      return (
        <div
          class={getClasses<{ collapsed?: boolean }>(
            { collapsed: collapse },
            'QuillFormattedText'
          )}
          oncreate={() => {
            // if (!(<any>window).twttr) {
            //   loadScript('//platform.twitter.com/widgets.js').then(() => {
            //     console.log('Twitter Widgets loaded');
            //   })
          }}
        >
          {renderQuillDelta(
            truncatedDoc,
            hideFormatting,
            collapse,
            openLinksInNewTab
          )}
        </div>
      );
    }
  }
}
