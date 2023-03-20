import { redraw } from 'mithrilInterop';
import { notifyError } from 'controllers/app/notifications';
import { loadScript } from 'helpers';
import { detectURL } from 'helpers/threads';
import $ from 'jquery';
import { MarkdownShortcuts } from 'lib/markdownShortcuts';
import _ from 'lodash';
import { MinimumProfile as Profile } from 'models';
import moment from 'moment';
import Quill from 'quill';
import type QuillMention from 'quill-mention';

import app from 'state';
import type {
  DeltaOps,
  QuillActiveMode,
  QuillDelta,
  QuillTextContents,
} from './types';

/* eslint-disable */

const REGEXP_GLOBAL = /https?:\/\/[^\s]+/g;
const REGEXP_WITH_PRECEDING_WS = /(?:\s|^)(https?:\/\/[^\s]+)/;

export default class QuillEditorInternal {
  private Delta;
  private Clipboard;
  private QuillImageDropAndPaste;
  private ImageUploader;
  private QuillMention;
  protected _activeMode: QuillActiveMode;
  protected _alteredText: boolean;
  protected _quill: Quill;
  protected _unsavedChanges; // TODO: Figure out type

  private readonly _$editor: JQuery<HTMLElement>;
  private readonly _editorNamespace: string;
  private readonly _onkeyboardSubmit: () => void;

  constructor(
    $editor: JQuery<HTMLElement>,
    defaultMode: QuillActiveMode,
    editorNamespace: string,
    onkeyboardSubmit: () => void
  ) {
    this._$editor = $editor;
    this._activeMode = defaultMode;
    this._editorNamespace = editorNamespace;
    this._onkeyboardSubmit = onkeyboardSubmit;
  }

  protected async _initializeEditor(
    theme: string,
    imageUploader: boolean,
    placeholder: string,
    defaultContents: QuillTextContents,
    tabIndex?: number
  ) {
    const Quill = await import('quill');

    this.QuillImageDropAndPaste = await import('quill-image-drop-and-paste');
    this.ImageUploader = await import('quill-image-uploader');
    this.QuillMention = await import('quill-mention');
    this.Delta = Quill.import('delta');
    this.Clipboard = Quill.import('modules/clipboard') as any;
    // Remove existing editor, if there is one
    this._$editor.empty();
    this._$editor.siblings('.ql-toolbar').remove();

    // Register modules and blots (Twitter, Video, Block etc)
    this._registerModules();

    this._quill = new Quill(this._$editor[0], {
      debug: 'error',
      modules: {
        toolbar: ([[{ header: 1 }, { header: 2 }]] as any).concat([
          ['bold', 'italic', 'strike'],
          ['link', 'code-block', 'blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
        ]),
        imageDropAndPaste: {
          handler: (imageDataUrl, type) =>
            this._imageHandler(imageDataUrl, type),
        },
        // TODO: Currently works, but throws Parchment error. Smooth functionality
        // requires troubleshooting
        imageUploader,
        markdownShortcuts: {
          suppress: () => {
            return this._activeMode === 'markdown';
          },
        },
        keyboard: { bindings: this._getKeyBindings() },
        mention: {
          allowedChars: /^[A-Za-z0-9\sÅÄÖåäö\-_.]*$/,
          mentionDenotationChars: ['@'],
          dataAttributes: ['name', 'link', 'component'],
          renderItem: (item) => item.component,
          onSelect: (item: QuillMention) => this._selectMention(item),
          source: _.debounce(this._queryMentions, 300, {
            leading: true,
            trailing: true,
          }),
          isolateChar: true,
        },
        clipboard: {
          matchers: [
            [
              Node.ELEMENT_NODE,
              (node, delta) => {
                return delta.compose(
                  new this.Delta().retain(delta.length(), {
                    header: false,
                    align: false,
                    color: false,
                    background: false,
                  })
                );
              },
            ],
          ],
        },
      },
      placeholder,
      formats: [
        'bold',
        'italic',
        'strike',
        'code',
        'link',
        'blockquote',
        'code-block',
        'header',
        'list',
        'twitter',
        'video',
        'mention',
      ],
      theme,
    });

    // Set up auto-hyperlinking of pasted URIs
    this._configureAutoLinkPaste();

    // Set up formatting toolbar
    this._configureToolbar();

    // Set tab index
    if (tabIndex) {
      // TODO: Are both of these necessary?
      this._$editor
        .closest('.QuillEditor')
        .find('.ql-editor')
        .attr('tabIndex', tabIndex);
    }

    this._unsavedChanges = new this.Delta();
    this._addChangesListener();

    // Restore defaultContent
    if (defaultContents) this._restoreSavedContents(defaultContents);

    setInterval(() => {
      if (this._unsavedChanges.length() > 0) {
        if (this._quill.isEnabled()) {
          // Save the entire updated text to localStorage
          const data = JSON.stringify(this._quill.getContents());
          localStorage.setItem(
            `${app.activeChainId()}-${this._editorNamespace}-storedText`,
            data
          );
          this._unsavedChanges = new this.Delta();
        }
        redraw();
      }
    }, 250);

    return this._quill;
  }

  // CHANGE LISTENERS & CONTENT RESTORATION

  protected _addChangesListener() {
    this._quill.on('text-change', (delta, oldDelta, source) => {
      this._unsavedChanges = this._unsavedChanges.compose(delta);
      // Log that the this._quill doc has been altered, so that
      // newThread draft system prompts w/ save confirmation modal
      if (source === 'user' && !this._alteredText) {
        this._alteredText = true;
        redraw();
      }
    });
  }

  protected _clearLocalStorage() {
    Object.keys(localStorage)
      .filter((key) => key.includes(this._editorNamespace))
      .forEach((key) => {
        localStorage.removeItem(key);
      });

    if (
      this._editorNamespace.includes('new-thread') ||
      this._editorNamespace.includes('new-link')
    ) {
      Object.keys(localStorage)
        .filter(
          (key) => key.includes('active-topic') || key.includes('post-type')
        )
        .forEach((key) => {
          localStorage.removeItem(key);
        });
    }
  }

  // TODO: Ensure is working
  protected _restoreSavedContents(contents: string | QuillDelta | DeltaOps) {
    if (typeof contents === 'string') {
      this._quill.setText(contents);
      this._quill.activeMode = 'markdown';
    } else if (typeof contents === 'object') {
      // TODO: Delta vs DeltaOps format—do both work?
      this._quill.setContents(contents);
      this._quill.activeMode = 'richText';
    }

    this._quill.setSelection(this._quill.getText().length - 1);
    this._quill.focus();
  }

  // FORMAT & TOOLBAR

  // Set up toolbar
  private _configureToolbar() {
    const toolbar = this._quill.getModule('toolbar');

    const makeMarkdownToolbarHandlerInline = (handler, fmt) => {
      toolbar.addHandler(handler, (value) => {
        if (this._activeMode === 'richText')
          return this._quill.format(handler, value);
        const { index, length } = this._quill.getSelection();
        const text = this._quill.getText();

        if (length > 0) {
          const textBefore = text.slice(0, index);
          const textAfter = text.slice(index + length);
          const formattedText = this._addFmt(
            fmt,
            text.slice(index, index + length),
            true
          );
          this._quill.setText(textBefore + formattedText + textAfter);
          this._quill.setSelection(index, formattedText.length);
        } else {
          this._quill.insertText(index, fmt.trimLeft()); // trim fmt, so we don't end up with extra newline at the start
          this._quill.setSelection(index + fmt.trimLeft().length, length);
        }
      });
    };
    makeMarkdownToolbarHandlerInline('bold', '**');
    makeMarkdownToolbarHandlerInline('italic', '_');
    makeMarkdownToolbarHandlerInline('code', '`');
    makeMarkdownToolbarHandlerInline('strike', '~~');
    makeMarkdownToolbarHandlerInline('code-block', '\n```\n');

    const makeMarkdownToolbarHandler = (handler, fmtOption) => {
      toolbar.addHandler(handler, (value) => {
        if (value === 'check') value = 'unchecked';
        if (this._activeMode === 'richText')
          return this._quill.format(handler, value);

        const { index, length } = this._quill.getSelection();
        const text = this._quill.getText();
        const fmt =
          typeof fmtOption === 'string' ? fmtOption : fmtOption[value];
        if (length > 0) {
          // If there is a selection, insert (newline + fmt) before the selection
          // Then set the selection at the end of the line
          this._quill.setText(
            text.slice(0, index) +
              this._addFmt(fmt, text.slice(index, index + length)) +
              text.slice(index + length).trimRight()
          );
          this._quill.setSelection(
            text.slice(0, index).length +
              this._addFmt(fmt, text.slice(index, index + length)).length
          );
        } else {
          // If there is no selection, backtrack to the beginning of the current line
          // Then insert the current line, formatted using the block formatter
          const linesBefore = text.slice(0, index).split('\n');
          const linesAfter = text.slice(index).split('\n');

          const thisBefore = linesBefore.splice(-1);
          const thisAfter = linesAfter.splice(0, 1);

          const textBefore = linesBefore.join('\n');
          const textAfter = linesAfter.join('\n');
          const formattedLine =
            (linesBefore.length === 0 ? '' : '\n') +
            this._addFmt(
              fmt,
              (thisBefore.length > 0 ? thisBefore[0] : '') +
                (thisAfter.length > 0 ? thisAfter[0] : '')
            ) +
            (linesAfter.length === 0 ? '' : '\n');
          const result = textBefore + formattedLine + textAfter;
          this._quill.setText(result);
          this._quill.setSelection(
            textBefore.length + formattedLine.length - 1
          );
        }
      });
    };
    makeMarkdownToolbarHandler('header', { 1: '# ', 2: '## ' });
    makeMarkdownToolbarHandler('blockquote', '> ');
    makeMarkdownToolbarHandler('list', {
      ordered: (index) => `${index + 1}. `,
      bullet: '- ',
      unchecked: '- [ ] ',
    });

    // Set up remaining couple of Markdown toolbar options
    const defaultLinkHandler = this._quill.theme.modules.toolbar.handlers.link;
    toolbar.addHandler('link', (value) => {
      if (this._activeMode === 'richText')
        return defaultLinkHandler.call({ quill: this._quill }, value);

      const { index, length } = this._quill.getSelection();
      const text = this._quill.getText();

      if (length > 0) {
        const selectedText = text.slice(index, index + length);
        if (selectedText.indexOf('\n') !== -1) return;
        const linkPre = '[';
        const linkBetween = '](';
        const linkHref =
          selectedText.startsWith('https://') ||
          selectedText.startsWith('http://')
            ? selectedText
            : 'https://';
        const linkPost = ')';
        this._quill.deleteText(index, length);
        this._quill.insertText(
          index,
          linkPre + selectedText + linkBetween + linkHref + linkPost
        );
        this._quill.setSelection(
          index + linkPre.length + selectedText.length + linkBetween.length,
          linkHref.length
        );
      } else {
        const linkText = prompt('Enter link text:');
        if (linkText === null) return;
        let linkHref =
          linkText.startsWith('https://') || linkText.startsWith('http://')
            ? linkText
            : prompt('Enter link:', 'https://');
        if (linkHref === null) {
          // Insert link with placeholder href
          const linkPre = `[${linkText}](`;
          linkHref = 'https://';
          const linkPost = ')';
          this._quill.insertText(index, linkPre + linkHref + linkPost);
          this._quill.setSelection(index + linkPre.length, linkHref.length);
        } else {
          // Insert link with href
          const linkPre = `[${linkText}](`;
          const linkPost = ')';
          this._quill.insertText(index, linkPre + linkHref + linkPost);
          this._quill.setSelection(index + linkPre.length, linkHref.length);
        }
      }
    });

    // Set up preview button in toolbar
    this._$editor
      .parent()
      .find('button.ql-preview')
      .on('click', (e) => {
        const markdownMode = this._activeMode === 'markdown';

        return null;
        // @REACT @TODO: Re-add modal using new pattern
        //   modal: PreviewModal,
        //   data: {
        //     doc: markdownMode
        //       ? this._quill.getText()
        //       : JSON.stringify(this._quill.getContents()),
        //   },
      });
  }

  // Setup custom keyboard bindings, override Quill default bindings where necessary
  private _getKeyBindings() {
    return {
      // Don't insert hard tabs
      tab: {
        key: 'Tab',
        handler: () => true,
      },
      // Check for embeds on return
      'new line': {
        key: 'Enter',
        shortKey: false,
        shiftKey: null,
        handler: (range, context) => this._newLineHandler(range, context),
      },
      // Check for mentions on return
      'add-mention': {
        key: 'Enter',
        shortKey: false,
        shiftKey: null,
        handler: (range, context) => this._mentionHandler(range, context),
      },
      // Submit on enter if an onkeyboardSubmit function is passed
      submit: {
        key: 'Enter',
        shortKey: false,
        // TODO: Gate with Meta key, universalize submission
        handler: (range, context) =>
          this._onkeyboardSubmitHandler(range, context),
      },
      // Close headers, code blocks, and blockquotes when backspacing the start of a line
      'header backspace': {
        key: 'Backspace',
        collapsed: true,
        format: ['header'],
        offset: 0,
        handler: (range, context) => {
          this._quill.format('header', false, 'user');
        },
      },
      'blockquote backspace': {
        key: 'Backspace',
        collapsed: true,
        format: ['blockquote'],
        offset: 0,
        handler: (range, context) => {
          this._quill.format('blockquote', false, 'user');
        },
      },
      'code backspace': {
        key: 'Backspace',
        collapsed: true,
        format: ['code-block'],
        offset: 0,
        suffix: /^\s+$/,
        handler: (range, context) => {
          this._quill.format('code-block', false, 'user');
        },
      },
      // Only start a list when 1. is typed, not other numeric indices.
      // Don't start lists in Markdown mode
      'list autofill': {
        key: ' ',
        collapsed: true,
        format: { list: false },
        prefix: /^\s*(1{1,1}\.|\*|-)$/,
        handler: (range, context) => this._listAutofillHandler(range, context),
      },
      // Don't boldface, italicize, or underline text when hotkeys are pressed in Markdown mode
      bold: {
        key: 'b',
        shortKey: true,
        handler: (range, context) => this._inlineFormatHandler(context, 'bold'),
      },
      italic: {
        key: 'i',
        shortKey: true,
        handler: (range, context) =>
          this._inlineFormatHandler(context, 'italic'),
      },
      underline: {
        key: 'u',
        shortKey: true,
        handler: (range, context) =>
          this._inlineFormatHandler(context, 'underline'),
      },
      // Check for links
      autolinks: {
        collapsed: true,
        key: ' ',
        prefix: REGEXP_WITH_PRECEDING_WS,
        handler: (range, context) => this._handleAutolinks(range, context),
      },
      autolinks2: {
        collapsed: true,
        key: 'Enter',
        prefix: REGEXP_WITH_PRECEDING_WS,
        handler: (range, context) => this._handleAutolinks(range, context),
      },
    };
  }

  // Helper function to add formatting around multiline text blocks
  // Special cases:
  // - string formatters with newlines are always applied around the whole block (e.g. ```)
  // - block formatters are not applied on empty lines, unless:
  //    - they have passed a function to generate the format for each line (e.g. ordered lists)
  //    - all the lines are empty, in which case we apply the formatter once, at the start
  private _addFmt(fmt, text, isInlineFormatter = false) {
    if (typeof fmt === 'string' && fmt.indexOf('\n') !== -1) {
      return (fmt + text + fmt).trim();
    }
    if (typeof fmt === 'string' && text.trim() === '') {
      return fmt + text;
    }
    return text
      .split('\n')
      .map((line, index) => {
        if (typeof fmt === 'string' && line.trim() === '') return line;
        else if (typeof fmt === 'string')
          return isInlineFormatter ? fmt + line + fmt : fmt + line;
        else
          return isInlineFormatter
            ? fmt(index) + line + fmt(index)
            : fmt(index) + line;
      })
      .join('\n');
  }

  private _configureAutoLinkPaste() {
    // Set up autolinks pasting
    this._quill.clipboard.addMatcher(Node.TEXT_NODE, (node, delta) => {
      if (typeof node.data !== 'string') return;

      const matches = node.data.match(REGEXP_GLOBAL);
      if (matches && matches.length > 0 && this._activeMode === 'richText') {
        const ops = [];
        let str = node.data;
        matches.forEach((match) => {
          const split = str.split(match);
          const beforeLink = split.shift();
          ops.push({ insert: beforeLink });
          ops.push({ insert: match, attributes: { link: match } });
          str = split.join(match);
        });
        ops.push({ insert: str });
        delta.ops = ops;
      }
      return delta;
    });
  }

  private _handleAutolinks(range, context) {
    if (this._activeMode === 'markdown') return true;
    const url = this._sliceFromLastWhitespace(context.prefix);
    const retain = range.index - url.length;
    const ops = (retain ? [{ retain }] : []) as any;
    ops.push(
      { delete: url.length },
      { insert: url, attributes: { link: url } }
    );
    this._quill.updateContents({ ops });
    return true;
  }

  private _insertEmbeds(text: string) {
    const twitterRe =
      /^(?:http[s]?:\/\/)?(?:www[.])?twitter[.]com\/.+?\/status\/(\d+)$/;
    const videoRe =
      /^(?:http[s]?:\/\/)?(?:www[.])?((?:vimeo\.com|youtu\.be|youtube\.com)\/[^\s]+)$/;
    const embeddableTweet = twitterRe.test(text);
    const embeddableVideo = videoRe.test(text);
    const insertionIdx = this._quill.getSelection().index;
    // TODO: Build out embeds for non-Vimeo/YT players
    if (embeddableTweet) {
      const id = text.match(twitterRe)[1];
      this._quill.insertEmbed(insertionIdx, 'twitter', id, 'user');
      this._quill.insertText(insertionIdx + 1, '\n', 'user');
      this._quill.setSelection(insertionIdx + 2, 'silent');
      setTimeout(() => {
        const embedEle = document.querySelectorAll(`div[data-id='${id}']`)[0];
        const widgetsEle = embedEle?.children[0];
        const isRendered =
          widgetsEle &&
          Array.from(widgetsEle.classList).includes('twitter-tweet-rendered');
        const isVisible =
          (embedEle?.children[0] as HTMLElement)?.style['visibility'] !==
          'hidden';
        if (isRendered && isVisible) {
          this._quill.deleteText(insertionIdx - text.length, text.length + 1);
          this._quill.setSelection(insertionIdx - text.length + 1, 'silent');
        } else {
          // Nested setTimeouts ensure that the embedded URL is deleted both more quickly
          // and more reliably than would be the case with a single .750ms timeout
          setTimeout(() => {
            const _embedEle = document.querySelectorAll(
              `div[data-id='${id}']`
            )[0];
            const _widgetsEle = _embedEle?.children[0];
            const _isRendered =
              _widgetsEle &&
              Array.from(_widgetsEle.classList).includes(
                'twitter-tweet-rendered'
              );
            const _isVisible =
              (_embedEle?.children[0] as HTMLElement)?.style['visibility'] !==
              'hidden';
            if (_isRendered && _isVisible) {
              this._quill.deleteText(
                insertionIdx - text.length,
                text.length + 1
              );
              this._quill.setSelection(
                insertionIdx - text.length + 1,
                'silent'
              );
            }
          }, 500);
        }
      }, 250);
      return true;
    } else if (embeddableVideo) {
      let url = `https://${text.match(videoRe)[1]}`;
      if (url.indexOf('watch?v=') !== -1) {
        url = url.replace('watch?v=', 'embed/');
        url = url.replace(/&.*$/, '');
      } else {
        url = url.replace('vimeo.com', 'player.vimeo.com/video');
      }
      this._quill.insertEmbed(insertionIdx, 'video', url, 'user');
      this._quill.insertText(insertionIdx + 1, '\n', 'user');
      this._quill.setSelection(insertionIdx + 2, 'silent');
      setTimeout(() => {
        if (document.querySelectorAll(`iframe[src='${url}']`).length) {
          this._quill.deleteText(insertionIdx - text.length, text.length + 1);
          this._quill.setSelection(insertionIdx - text.length + 2, 'silent');
        }
      }, 1);
      return true;
    }
    return false;
  }

  private async _queryMentions(
    searchTerm: string,
    renderList: (formattedMatches: QuillMention, searchTerm: string) => null,
    mentionChar: string
  ) {
    if (mentionChar !== '@') return;

    let members = [];
    let formattedMatches;
    if (searchTerm.length === 0) {
      const node = document.createElement('div');
      const tip = document.createElement('span');
      tip.innerText = 'Type to tag a member';
      node.appendChild(tip);
      formattedMatches = [
        {
          link: '#',
          name: '',
          component: node.outerHTML,
        },
      ];
      renderList(formattedMatches, searchTerm);
    } else if (searchTerm.length > 0) {
      members = await app.search.searchMentionableAddresses(searchTerm, {
        resultSize: 6,
        chainScope: app.activeChainId(),
      });
      formattedMatches = members.map((addr) => {
        const profile: Profile = app.newProfiles.getProfile(
          addr.chain,
          addr.address
        );
        const node = document.createElement('div');

        let avatar;
        if (profile.avatarUrl) {
          avatar = document.createElement('img');
          (avatar as HTMLImageElement).src = profile.avatarUrl;
          avatar.className = 'ql-mention-avatar';
          node.appendChild(avatar);
        } else {
          avatar = document.createElement('div');
          avatar.className = 'ql-mention-avatar';
          avatar.innerHTML = Profile.getSVGAvatar(addr.address, 20);
        }

        const nameSpan = document.createElement('span');
        nameSpan.innerText = addr.name;
        nameSpan.className = 'ql-mention-name';

        const addrSpan = document.createElement('span');
        addrSpan.innerText =
          addr.chain === 'near'
            ? addr.address
            : `${addr.address.slice(0, 6)}...`;
        addrSpan.className = 'ql-mention-addr';

        const lastActiveSpan = document.createElement('span');
        lastActiveSpan.innerText = profile.lastActive
          ? `Last active ${moment(profile.lastActive).fromNow()}`
          : null;
        lastActiveSpan.className = 'ql-mention-la';

        const textWrap = document.createElement('div');
        textWrap.className = 'ql-mention-text-wrap';

        node.appendChild(avatar);
        textWrap.appendChild(nameSpan);
        textWrap.appendChild(addrSpan);
        textWrap.appendChild(lastActiveSpan);
        node.appendChild(textWrap);

        return {
          link: `/${addr.chain}/account/${addr.address}`,
          name: addr.name,
          component: node.outerHTML,
        };
      });
    }
    renderList(formattedMatches, searchTerm);
  }

  private _registerModules() {
    // Register image uploader extension
    Quill.register('modules/imageUploader', this.ImageUploader);

    // Register drag'n'paste module
    Quill.register('modules/imageDropAndPaste', this.QuillImageDropAndPaste);

    // Register markdown shortcuts
    Quill.register('modules/markdownShortcuts', MarkdownShortcuts);

    // Register mentions module
    Quill.register({ 'modules/mention': this.QuillMention });

    // Register a patch to prevent pasting into long documents causing the editor to jump
    class CustomClipboard extends this.Clipboard {
      onCapturePaste(e) {
        if (e.defaultPrevented || !this.quill.isEnabled()) return;
        e.preventDefault();
        const range = this.quill.getSelection(true);
        if (range == null) return;
        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');
        const files = Array.from(e.clipboardData.files || []);
        if (!html && files.length > 0) {
          this._quill.uploader.upload(range, files);
        } else if (text || files.length > 1) {
          this.onPaste(
            range,
            this._activeMode === 'markdown' ? { text } : { html, text }
          );
        }
      }
    }

    // preemptively load Twitter Widgets, so users won't be confused by loading lag &
    // abandon an embed attempt
    if (!(<any>window).twttr)
      loadScript('//platform.twitter.com/widgets.js').then(() =>
        console.log('Twitter Widgets loaded')
      );

    const BlockEmbed = Quill.import('blots/block/embed');

    class TwitterBlot extends BlockEmbed {
      public static blotName = 'twitter';
      public static className = 'ql-twitter';
      public static tagName = 'div';

      public static create(id) {
        const node = super.create(id);
        node.dataset.id = id;
        if (!(<any>window).twttr) {
          loadScript('//platform.twitter.com/widgets.js').then(() => {
            setTimeout(() => {
              // eslint-disable-next-line
              (<any>window).twttr?.widgets?.load();
              // eslint-disable-next-line
              (<any>window).twttr?.widgets?.createTweet(id, node);
            }, 1);
          });
        } else {
          setTimeout(() => {
            // eslint-disable-next-line
            (<any>window).twttr?.widgets?.load();
            // eslint-disable-next-line
            (<any>window).twttr?.widgets?.createTweet(id, node);
          }, 1);
        }
        return node;
      }

      public static value(domNode) {
        const { id } = domNode.dataset;
        return { id };
      }
    }

    class VideoBlot extends BlockEmbed {
      public static blotName = 'video';
      public static className = 'ql-video';
      public static tagName = 'iframe';
      domNode: any;

      public static create(url) {
        const node = super.create(url);
        node.setAttribute('src', url);
        // Set non-format related attributes with static values
        node.setAttribute('frameborder', '0');
        node.setAttribute('allowfullscreen', true);
        // TODO: Set height/width values according to Quill editor dimensions
        return node;
      }

      public static formats(node) {
        // We still need to report unregistered embed formats
        const format = {};
        if (node.hasAttribute('height')) {
          format['height'] = node.getAttribute('height');
        }
        if (node.hasAttribute('width')) {
          format['width'] = node.getAttribute('width');
        }
        return format;
      }

      public static value(node) {
        return node.getAttribute('src');
      }

      format(name, value) {
        // Handle unregistered embed formats
        if (name === 'height' || name === 'width') {
          if (value) {
            this.domNode.setAttribute(name, value);
          } else {
            this.domNode.removeAttribute(name, value);
          }
        } else {
          super.format(name, value);
        }
      }
    }

    Quill.register('modules/clipboard', CustomClipboard, true);
    Quill.register('formats/twitter', TwitterBlot, true);
    Quill.register('formats/video', VideoBlot, true);
  }

  private _selectMention(item: QuillMention) {
    if (item.link === '#' && item.name === '') return;
    const text = this._quill.getText();
    const cursorIdx = this._quill.selection.savedRange.index;
    const mentionLength =
      text.slice(0, cursorIdx).split('').reverse().indexOf('@') + 1;
    const beforeText = text.slice(0, cursorIdx - mentionLength);
    const afterText = text.slice(cursorIdx).replace(/\n$/, '');
    if (this._activeMode === 'markdown') {
      const fullText = `${beforeText}[@${item.name}](${
        item.link
      }) ${afterText.replace(/^ /, '')}`;
      this._quill.setText(fullText);
      this._quill.setSelection(
        fullText.length - afterText.length + (afterText.startsWith(' ') ? 1 : 0)
      );
    } else {
      const delta = new this.Delta()
        .retain(beforeText.length)
        .delete(mentionLength)
        .insert(`@${item.name}`, { link: item.link });
      if (!afterText.startsWith(' ')) delta.insert(' ');
      this._quill.updateContents(delta);
      this._quill.setSelection(
        this._quill.getLength() -
          afterText.length -
          (afterText.startsWith(' ') ? 0 : 1),
        0
      );
    }
  }

  // HANDLERS

  // Drag-and-drop and paste events
  private async _imageHandler(imageDataUrl, type) {
    if (!type) type = 'image/png';
    const index =
      (this._quill.getSelection() || {}).index || this._quill.getLength() || 0;

    // Filter out base64 format images from Quill
    const contents = this._quill.getContents();
    const indexesToFilter = [];
    contents.ops.forEach((op, idx) => {
      if (
        op.insert?.image?.startsWith('data:image/jpeg;base64') ||
        op.insert?.image?.startsWith('data:image/gif;base64') ||
        op.insert?.image?.startsWith('data:image/png;base64')
      )
        indexesToFilter.push(idx);
    });
    contents.ops = contents.ops.filter(
      (op, idx) => indexesToFilter.indexOf(idx) === -1
    );
    this._quill.setContents(contents.ops); // must set contents to contents.ops for some reason

    const isMarkdown = $('.QuillEditor').hasClass('markdown-mode');
    const file = this._dataURLtoFile(imageDataUrl, type);
    this._quill.enable(false);
    this._uploadImage(file)
      .then((uploadURL) => {
        this._quill.enable(true);
        if (typeof uploadURL === 'string' && detectURL(uploadURL)) {
          if (isMarkdown) {
            this._quill.insertText(index, `![](${uploadURL})`, 'user');
          } else {
            this._quill.insertEmbed(index, 'image', uploadURL);
          }
          this._quill.setSelection(
            index + (isMarkdown ? 5 + uploadURL.length : 1),
            0
          );
        }
      })
      .catch((err) => {
        notifyError('Failed to upload image. Was it a valid JPG, PNG, or GIF?');
        this._quill.enable(true);
      });
  }

  private _inlineFormatHandler(context, formatType: string) {
    if (this._activeMode === 'richText')
      this._quill.format(
        formatType,
        !context.format[formatType],
        Quill.sources.USER
      );
    return false;
  }

  private _listAutofillHandler(range, context) {
    if (this._activeMode === 'markdown') return true;
    const length = context.prefix.length;
    const [line, offset] = this._quill.getLine(range.index);

    if (offset > length) return true;
    let value;
    switch (context.prefix.trim()) {
      case '-':
      case '*':
        value = 'bullet';
        break;
      default:
        value = 'ordered';
    }
    this._quill.insertText(range.index, ' ', 'user');
    this._quill.history.cutoff();
    const delta = new this.Delta()
      .retain(range.index - offset)
      .delete(length + 1)
      .retain(line.length() - 2 - offset)
      .retain(1, { list: value });
    this._quill.updateContents(delta, 'user');
    this._quill.history.cutoff();
    this._quill.setSelection(range.index - length, 'silent');
  }

  private _mentionHandler(range, context) {
    const mentions = this._quill.getModule('mention');
    if (mentions.isOpen) {
      this._selectMention(mentions.getItemData());
      mentions.escapeHandler();
      return false;
    } else {
      return true;
    }
  }

  private _newLineHandler(range, context) {
    if (this._activeMode === 'markdown') return true;
    const [line, offset] = this._quill.getLine(range.index);
    const { textContent } = line.domNode;
    const isEmbed = this._insertEmbeds(textContent);
    // If embed, stopPropogation; otherwise continue.
    return !isEmbed;
  }

  private _onkeyboardSubmitHandler(range, context) {
    if (this._onkeyboardSubmit) {
      this._onkeyboardSubmit();
      return false;
    } else {
      return true;
    }
  }

  // HELPERS

  private _createSpinner() {
    const ele = document.createElement('div');
    ele.classList.add('cui-spinner');
    ele.classList.add('cui-spinner-active');
    ele.classList.add('cui-spinner-fill');
    ele.classList.add('spinner-wrap');
    const firstChild = document.createElement('div');
    const secondChild = document.createElement('div');
    firstChild.classList.add('cui-spinner-content');
    secondChild.classList.add('cui-spinner-icon');
    firstChild.appendChild(secondChild);
    ele.appendChild(firstChild);
    return ele;
  }

  private _dataURLtoFile(dataurl: string, type: string) {
    const arr = dataurl.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const filename = new Date().getTime().toString();
    return new File([u8arr], filename, { type });
  }

  private _sliceFromLastWhitespace(str: string) {
    const whitespaceI = str.lastIndexOf(' ');
    const sliceI = whitespaceI === -1 ? 0 : whitespaceI + 1;
    return str.slice(sliceI);
  }

  private async _uploadImage(file) {
    return new Promise((resolve, reject) => {
      document
        .getElementsByClassName('ql-container')[0]
        .appendChild(this._createSpinner());
      // TODO: Change to POST /uploadSignature
      // TODO: Reuse code since this is used in other places
      $.post(`${app.serverUrl()}/getUploadSignature`, {
        name: file.name, // tokyo.png
        mimetype: file.type, // image/png
        auth: true,
        jwt: app.user.jwt,
      })
        .then((response) => {
          if (response.status !== 'Success') {
            document.getElementsByClassName('spinner-wrap')[0].remove();
            alert('Upload failed');
            return reject(
              new Error(
                `Failed to get an S3 signed upload URL: ${response.error}`
              )
            );
          }
          $.ajax({
            type: 'PUT',
            url: response.result,
            contentType: file.type,
            processData: false, // don't send as form
            data: file,
          })
            .then(() => {
              // file uploaded
              const trimmedURL = response.result.slice(
                0,
                response.result.indexOf('?')
              );
              document.getElementsByClassName('spinner-wrap')[0].remove();
              resolve(trimmedURL);
              console.log(`Upload succeeded: ${trimmedURL}`);
            })
            .catch((err) => {
              // file not uploaded
              document.getElementsByClassName('spinner-wrap')[0].remove();
              alert('Upload failed');
              console.log(`Upload failed: ${response.result}`);
              reject(new Error(`Upload failed: ${err}`));
            });
        })
        .catch((err: any) => {
          document.getElementsByClassName('spinner-wrap')[0].remove();
          err = err.responseJSON ? err.responseJSON.error : err.responseText;
          reject(new Error(`Failed to get an S3 signed upload URL: ${err}`));
        });
    });
  }
}
