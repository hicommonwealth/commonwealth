/* eslint-disable */
import 'components/quill/markdown_formatted_text.scss';
import DOMPurify from 'dompurify';
import { findAll } from 'highlight-words-core';
import { marked } from 'marked';
/* eslint-disable no-useless-escape */
import type { ResultNode } from 'mithrilInterop';
import { ClassComponent, redraw, render, rootRender } from 'mithrilInterop';
import React from 'react';
import smartTruncate from 'smart-truncate';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';

import { getClasses } from '../component_kit/helpers';
import { countLinesMarkdown } from '../react_quill_editor/utils';

const renderer = new marked.Renderer();

marked.setOptions({
  renderer,
  gfm: true, // use github flavored markdown
  smartypants: true,
  smartLists: true,
  xhtml: true,
});

type MarkdownFormattedTextAttrs = {
  collapse?: boolean;
  doc: string;
  hideFormatting?: boolean;
  openLinksInNewTab?: boolean;
  searchTerm?: string;
  cutoffLines?: number;
};

// TODO: Replace usages of this component with react_quill_editor/MarkdownFormattedText
export class MarkdownFormattedText extends ClassComponent<MarkdownFormattedTextAttrs> {
  private cachedDocWithHighlights: string;
  private cachedResultWithHighlights;
  truncatedDoc;
  isTruncated: boolean;

  oninit(vnode: ResultNode<MarkdownFormattedTextAttrs>) {
    this.isTruncated =
      vnode.attrs.cutoffLines &&
      vnode.attrs.cutoffLines < countLinesMarkdown(vnode.attrs.doc);
    if (this.isTruncated) {
      this.truncatedDoc = vnode.attrs.doc.slice(
        0,
        vnode.attrs.doc.split('\n', vnode.attrs.cutoffLines).join('\n').length
      );
    } else {
      this.truncatedDoc = vnode.attrs.doc;
    }
  }

  view(vnode: ResultNode<MarkdownFormattedTextAttrs>) {
    const {
      doc,
      hideFormatting,
      collapse,
      searchTerm,
      openLinksInNewTab,
      cutoffLines,
    } = vnode.attrs;

    if (!doc) return;

    const toggleDisplay = () => {
      this.isTruncated = !this.isTruncated;
      if (this.isTruncated) {
        this.truncatedDoc = doc.slice(
          0,
          doc.split('\n', cutoffLines).join('\n').length
        );
      } else {
        this.truncatedDoc = doc;
      }
      redraw();
    };

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
      if (JSON.stringify(doc) !== this.cachedDocWithHighlights) {
        const unsanitized = marked.parse(doc.toString());

        const sanitized = DOMPurify.sanitize(unsanitized, {
          ALLOWED_TAGS: ['a'],
          ADD_ATTR: ['target'],
        });

        const vnodes = render.trust(sanitized);

        const root = document.createElement('div');

        rootRender(root, vnodes);

        const textToHighlight = root.innerText
          .replace(/\n/g, ' ')
          .replace(/\ +/g, ' ');

        const chunks = findAll({
          searchWords: [searchTerm.trim()],
          textToHighlight,
        });

        this.cachedDocWithHighlights = JSON.stringify(doc);

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

            return highlight ? <mark>{text}</mark> : <span>{text}</span>;
          }
        );
      }

      return (
        <div
          className={getClasses<{ collapsed?: boolean }>(
            { collapsed: !!collapse },
            'MarkdownFormattedText'
          )}
        >
          {this.cachedResultWithHighlights}
        </div>
      );
    } else {
      if (!doc) return <></>;
      if (this.isTruncated) {
        this.truncatedDoc = doc.slice(
          0,
          doc.split('\n', cutoffLines).join('\n').length
        );
      }
      if (!this.truncatedDoc) return <></>;

      const unsanitized = marked.parse(this.truncatedDoc.toString());

      const sanitized = hideFormatting
        ? DOMPurify.sanitize(unsanitized, {
            ALLOWED_TAGS: ['a'],
            ADD_ATTR: ['target'],
          })
        : DOMPurify.sanitize(unsanitized, {
            USE_PROFILES: { html: true },
            ADD_ATTR: ['target'],
          });

      const results = render.trust(sanitized);

      return (
        <>
          <div
            className={getClasses<{ collapsed?: boolean }>(
              { collapsed: !!collapse },
              'MarkdownFormattedText'
            )}
          >
            {results}
          </div>
          {this.isTruncated && (
            <div className="show-more-button-wrapper">
              <div className="show-more-button" onClick={toggleDisplay}>
                <CWIcon iconName="plus" iconSize="small" />
                <div className="show-more-text">Show More</div>
              </div>
            </div>
          )}
        </>
      );
    }
  }
}
