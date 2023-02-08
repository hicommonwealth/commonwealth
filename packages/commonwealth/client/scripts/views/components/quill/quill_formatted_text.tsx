import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
    Component,
  rootRender,
} from 'mithrilInterop';

import 'components/quill/quill_formatted_text.scss';
import { findAll } from 'highlight-words-core';
import smartTruncate from 'smart-truncate';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { getClasses } from '../component_kit/helpers';
import { countLinesQuill } from './helpers';

// import { loadScript } from 'helpers';
import { renderQuillDelta } from './render_quill_delta';

export type QuillTextParams = {
  collapse?: boolean;
  hideFormatting?: boolean;
  cutoffLines?: number;
  openLinksInNewTab?: boolean;
  searchTerm?: string;
};

type QuillFormattedTextAttrs = {
  doc;
} & QuillTextParams;

export class QuillFormattedText extends ClassComponent<QuillFormattedTextAttrs> {
  private cachedDocWithHighlights: string;
  private cachedResultWithHighlights;
  private isTruncated: boolean;
  private truncatedDoc;

  oninit(vnode: ResultNode<QuillFormattedTextAttrs>) {
    this.isTruncated =
      vnode.attrs.cutoffLines &&
      vnode.attrs.cutoffLines < countLinesQuill(vnode.attrs.doc.ops);

    if (this.isTruncated) {
      this.truncatedDoc = {
        ops: [...vnode.attrs.doc.ops.slice(0, vnode.attrs.cutoffLines)],
      };
    } else {
      this.truncatedDoc = vnode.attrs.doc;
    }
  }

  view(vnode: ResultNode<QuillFormattedTextAttrs>) {
    const {
      doc,
      hideFormatting,
      collapse,
      searchTerm,
      openLinksInNewTab,
      cutoffLines,
    } = vnode.attrs;

    const toggleDisplay = () => {
      this.isTruncated = !this.isTruncated;

      if (this.isTruncated) {
        this.truncatedDoc = { ops: [...doc.ops.slice(0, cutoffLines)] };
      } else {
        this.truncatedDoc = doc;
      }

      this.redraw();
    };

    // if we're showing highlighted search terms, render the doc once, and cache the result
    if (searchTerm) {
      if (JSON.stringify(this.truncatedDoc) !== this.cachedDocWithHighlights) {
        const vnodes = this.truncatedDoc
          ? renderQuillDelta(this.truncatedDoc, hideFormatting, true)
          : []; // collapse = true, to inline blocks

        const root = document.createElement('div');

        rootRender(root, vnodes);

        const textToHighlight = root.innerText
          .replace(/\n/g, ' ')
          .replace(/\+/g, ' ');

        const chunks = findAll({
          searchWords: [searchTerm.trim()],
          textToHighlight,
        });

        this.cachedDocWithHighlights = JSON.stringify(this.truncatedDoc);

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
          className={getClasses<{ collapsed?: boolean }>(
            { collapsed: collapse },
            'QuillFormattedText'
          )}
          // oncreate={() => {
          // if (!(<any>window).twttr) {
          //   loadScript('//platform.twitter.com/widgets.js').then(() => {
          //     console.log('Twitter Widgets loaded');
          //   })
          // }}
        >
          {this.truncatedDoc &&
            renderQuillDelta(
              this.truncatedDoc,
              hideFormatting,
              collapse,
              openLinksInNewTab
            )}
          {this.isTruncated && (
            <div className="show-more-button-wrapper">
              <div className="show-more-button" onClick={toggleDisplay}>
                <CWIcon iconName="plus" iconSize="small" />
                <div className="show-more-text">Show More</div>
              </div>
            </div>
          )}
        </div>
      );
    }
  }
}
