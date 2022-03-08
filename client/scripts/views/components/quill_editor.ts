import 'components/quill_editor.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import Quill from 'quill-2.0-dev/quill';
import { Tag, Tooltip } from 'construct-ui';
import ImageUploader from 'quill-image-uploader';
import Image from 'quill/formats/image';
import QuillImageDropAndPaste from 'quill-image-drop-and-paste';
import { MarkdownShortcuts } from 'lib/markdownShortcuts';
import QuillMention from 'quill-mention';

import app from 'state';
import { loadScript } from 'helpers';
import { detectURL } from 'helpers/threads';
import { notifyError } from 'controllers/app/notifications';
import SettingsController from 'controllers/app/settings';
import { Profile } from 'models';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import PreviewModal from 'views/modals/preview_modal';
import { CWIcon } from './component_kit/cw_icons/cw_icon';

// Rich text and Markdown editor.
//
// When the editor is created, oncreateBind is called with the state
// object. This can be used to retrieve the editor and mode later.
//
// The editor can be toggled between rich text and markdown mode.
// Toggling reinitializes the editor, with or without a list of
// `formats` and the rich text toolbar (there doesn't appear to be a
// way to unregister formats once the editor has been initialized)

// Modified quill-auto-links for proper behavior with Markdown and pasting.

const REGEXP_GLOBAL = /https?:\/\/[^\s]+/g;
const REGEXP_WITH_PRECEDING_WS = /(?:\s|^)(https?:\/\/[^\s]+)/;

const sliceFromLastWhitespace = (str) => {
  const whitespaceI = str.lastIndexOf(' ');
  const sliceI = whitespaceI === -1 ? 0 : whitespaceI + 1;
  return str.slice(sliceI);
};

const instantiateEditor = (
  $editor: any,
  theme: string,
  hasFormats = true,
  imageUploader = true,
  placeholder: string,
  editorNamespace: string,
  state: any,
  onkeyboardSubmit: () => void
) => {
  const Delta = Quill.import('delta');
  const Keyboard = Quill.import('modules/keyboard');
  const Clipboard = Quill.import('modules/clipboard') as any;
  let quill;
  // Set up markdown mode helper
  const isMarkdownMode = () => $editor.parent('.markdown-mode').length > 0;

  // Remove existing editor, if there is one
  $editor.empty();
  $editor.siblings('.ql-toolbar').remove();

  // Register image uploader extension
  Quill.register('modules/imageUploader', ImageUploader);

  // Register drag'n'paste module
  Quill.register('modules/imageDropAndPaste', QuillImageDropAndPaste);

  // Register markdown shortcuts
  Quill.register('modules/markdownShortcuts', MarkdownShortcuts);

  // Register mentions module
  Quill.register({ 'modules/mention': QuillMention });

  const handleAutolinks = (range, context) => {
    if (isMarkdownMode()) return true;
    const url = sliceFromLastWhitespace(context.prefix);
    const retain = range.index - url.length;
    const ops = (retain ? [{ retain }] : []) as any;
    ops.push(
      { delete: url.length },
      { insert: url, attributes: { link: url } }
    );
    quill.updateContents({ ops });
    return true;
  };

  const insertEmbeds = (text) => {
    const twitterRe =
      /^(?:http[s]?:\/\/)?(?:www[.])?twitter[.]com\/.+?\/status\/(\d+)$/;
    const videoRe =
      /^(?:http[s]?:\/\/)?(?:www[.])?((?:vimeo\.com|youtu\.be|youtube\.com)\/[^\s]+)$/;
    const embeddableTweet = twitterRe.test(text);
    const embeddableVideo = videoRe.test(text);
    const insertionIdx = quill.getSelection().index;
    // TODO: Build out embeds for non-Vimeo/YT players
    if (embeddableTweet) {
      const id = text.match(twitterRe)[1];
      quill.insertEmbed(insertionIdx, 'twitter', id, 'user');
      quill.insertText(insertionIdx + 1, '\n', 'user');
      quill.setSelection(insertionIdx + 2, 'silent');
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
          quill.deleteText(insertionIdx - text.length, text.length + 1);
          quill.setSelection(insertionIdx - text.length + 1, 'silent');
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
              quill.deleteText(insertionIdx - text.length, text.length + 1);
              quill.setSelection(insertionIdx - text.length + 1, 'silent');
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
      quill.insertEmbed(insertionIdx, 'video', url, 'user');
      quill.insertText(insertionIdx + 1, '\n', 'user');
      quill.setSelection(insertionIdx + 2, 'silent');
      setTimeout(() => {
        if (document.querySelectorAll(`iframe[src='${url}']`).length) {
          quill.deleteText(insertionIdx - text.length, text.length + 1);
          quill.setSelection(insertionIdx - text.length + 2, 'silent');
        }
      }, 1);
      return true;
    }
    return false;
  };

  // Register a patch to prevent pasting into long documents causing the editor to jump
  class CustomClipboard extends Clipboard {
    onCapturePaste(e) {
      if (e.defaultPrevented || !this.quill.isEnabled()) return;
      e.preventDefault();
      const range = this.quill.getSelection(true);
      if (range == null) return;
      const html = e.clipboardData.getData('text/html');
      const text = e.clipboardData.getData('text/plain');
      const files = Array.from(e.clipboardData.files || []);
      if (!html && files.length > 0) {
        this.quill.uploader.upload(range, files);
      } else if (text || files.length > 1) {
        this.onPaste(range, isMarkdownMode() ? { text } : { html, text });
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

  const queryMentions = async (searchTerm, renderList, mentionChar) => {
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
      });
      formattedMatches = members.map((addr) => {
        const profile: Profile = app.profiles.getProfile(
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
  };

  const selectMention = (item) => {
    if (item.link === '#' && item.name === '') return;
    const text = quill.getText();
    const cursorIdx = quill.selection.savedRange.index;
    const mentionLength =
      text.slice(0, cursorIdx).split('').reverse().indexOf('@') + 1;
    const beforeText = text.slice(0, cursorIdx - mentionLength);
    const afterText = text.slice(cursorIdx).replace(/\n$/, '');
    if (isMarkdownMode()) {
      const fullText = `${beforeText}[@${item.name}](${
        item.link
      }) ${afterText.replace(/^ /, '')}`;
      quill.setText(fullText);
      quill.setSelection(
        fullText.length - afterText.length + (afterText.startsWith(' ') ? 1 : 0)
      );
    } else {
      const delta = new Delta()
        .retain(beforeText.length)
        .delete(mentionLength)
        .insert(`@${item.name}`, { link: item.link });
      if (!afterText.startsWith(' ')) delta.insert(' ');
      quill.updateContents(delta);
      quill.setSelection(
        quill.getLength() -
          afterText.length -
          (afterText.startsWith(' ') ? 0 : 1),
        0
      );
    }
  };

  // Setup custom keyboard bindings, override Quill default bindings where necessary
  const bindings = {
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
      handler: (range, context) => {
        if (isMarkdownMode()) return true;
        const [line, offset] = quill.getLine(range.index);
        const { textContent } = line.domNode;
        const isEmbed = insertEmbeds(textContent);
        // if embed, stopPropogation; otherwise continue
        return !isEmbed;
      },
    },
    // Check for mentions on return
    'add-mention': {
      key: 'Enter',
      shortKey: false,
      shiftKey: null,
      handler: (range, context) => {
        const mentions = quill.getModule('mention');
        if (mentions.isOpen) {
          selectMention(mentions.getItemData());
          mentions.escapeHandler();
          return false;
        } else {
          return true;
        }
      },
    },
    // Submit on cmd-Enter/ctrl-Enter
    submit: {
      key: 'Enter',
      shortKey: true,
      handler: () => {
        if (onkeyboardSubmit) {
          onkeyboardSubmit();
          return false;
        } else {
          return true;
        }
      },
    },
    // Close headers, code blocks, and blockquotes when backspacing the start of a line
    'header backspace': {
      key: 'Backspace',
      collapsed: true,
      format: ['header'],
      offset: 0,
      handler: (range, context) => {
        quill.format('header', false, 'user');
      },
    },
    'blockquote backspace': {
      key: 'Backspace',
      collapsed: true,
      format: ['blockquote'],
      offset: 0,
      handler: (range, context) => {
        quill.format('blockquote', false, 'user');
      },
    },
    'code backspace': {
      key: 'Backspace',
      collapsed: true,
      format: ['code-block'],
      offset: 0,
      suffix: /^\s+$/,
      handler: (range, context) => {
        quill.format('code-block', false, 'user');
      },
    },
    // Only start a list when 1. is typed, not other numeric indices.
    // Don't start lists in Markdown mode
    'list autofill': {
      key: ' ',
      collapsed: true,
      format: { list: false },
      prefix: /^\s*(1{1,1}\.|\*|-)$/,
      handler: (range, context) => {
        if (isMarkdownMode()) return true;
        const length = context.prefix.length;
        const [line, offset] = quill.getLine(range.index);

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
        quill.insertText(range.index, ' ', 'user');
        quill.history.cutoff();
        const delta = new Delta()
          .retain(range.index - offset)
          .delete(length + 1)
          .retain(line.length() - 2 - offset)
          .retain(1, { list: value });
        quill.updateContents(delta, 'user');
        quill.history.cutoff();
        quill.setSelection(range.index - length, 'silent');
      },
    },
    // Don't boldface, italicize, or underline text when hotkeys are pressed in Markdown mode
    bold: {
      key: 'b',
      shortKey: true,
      handler: (range, context) => {
        if (!isMarkdownMode())
          quill.format('bold', !context.format.bold, Quill.sources.USER);
        return false;
      },
    },
    italic: {
      key: 'i',
      shortKey: true,
      handler: (range, context) => {
        if (!isMarkdownMode())
          quill.format('italic', !context.format.italic, Quill.sources.USER);
        return false;
      },
    },
    underline: {
      key: 'u',
      shortKey: true,
      handler: (range, context) => {
        if (!isMarkdownMode())
          quill.format(
            'underline',
            !context.format.underline,
            Quill.sources.USER
          );
        return false;
      },
    },
    // Check for links
    autolinks: {
      collapsed: true,
      key: ' ',
      prefix: REGEXP_WITH_PRECEDING_WS,
      handler: handleAutolinks,
    },
    autolinks2: {
      collapsed: true,
      key: 'Enter',
      prefix: REGEXP_WITH_PRECEDING_WS,
      handler: handleAutolinks,
    },
  };

  const createSpinner = () => {
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
  };

  const dataURLtoFile = (dataurl: string, type: string) => {
    const arr = dataurl.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const filename = new Date().getTime().toString();
    return new File([u8arr], filename, { type });
  };

  const uploadImg = async (file) => {
    return new Promise((resolve, reject) => {
      document
        .getElementsByClassName('ql-container')[0]
        .appendChild(createSpinner());
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
  };

  // handle drag-and-drop and paste events
  const imageHandler = async (imageDataUrl, type) => {
    if (!type) type = 'image/png';
    const index = (quill.getSelection() || {}).index || quill.getLength() || 0;

    // filter out base64 format images from Quill
    const contents = quill.getContents();
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
    quill.setContents(contents.ops); // must set contents to contents.ops for some reason

    const isMarkdown = $('.QuillEditor').hasClass('markdown-mode');
    const file = dataURLtoFile(imageDataUrl, type);
    quill.enable(false);
    uploadImg(file)
      .then((uploadURL) => {
        quill.enable(true);
        if (typeof uploadURL === 'string' && detectURL(uploadURL)) {
          if (isMarkdown) {
            quill.insertText(index, `![](${uploadURL})`, 'user');
          } else {
            quill.insertEmbed(index, 'image', uploadURL);
          }
          quill.setSelection(
            index + (isMarkdown ? 5 + uploadURL.length : 1),
            0
          );
        }
      })
      .catch((err) => {
        notifyError('Failed to upload image. Was it a valid JPG, PNG, or GIF?');
        console.log(err);
        quill.enable(true);
      });
  };

  quill = new Quill($editor[0], {
    debug: 'error',
    modules: {
      toolbar: hasFormats
        ? ([[{ header: 1 }, { header: 2 }]] as any).concat([
            ['bold', 'italic', 'strike'],
            ['link', 'code-block', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
          ])
        : false,
      imageDropAndPaste: {
        handler: imageHandler,
      },
      // TODO: Currently works, but throws Parchment error. Smooth functionality
      // requires troubleshooting
      imageUploader: false,
      markdownShortcuts: {
        suppress: () => {
          return isMarkdownMode();
        },
      },
      keyboard: { bindings },
      mention: {
        allowedChars: /^[A-Za-z0-9\sÅÄÖåäö\-_.]*$/,
        mentionDenotationChars: ['@'],
        dataAttributes: ['name', 'link', 'component'],
        renderItem: (item) => item.component,
        onSelect: selectMention,
        source: _.debounce(queryMentions, 300, {
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
                new Delta().retain(delta.length(), {
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
    formats: hasFormats
      ? [
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
        ]
      : [],
    theme,
  });

  // Set up autolinks pasting
  quill.clipboard.addMatcher(Node.TEXT_NODE, (node, delta) => {
    if (typeof node.data !== 'string') return;

    const matches = node.data.match(REGEXP_GLOBAL);
    if (matches && matches.length > 0 && !isMarkdownMode()) {
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

  // Set up toolbar
  const toolbar = quill.getModule('toolbar');

  // Helper function to add formatting around multiline text blocks
  // Special cases:
  // - string formatters with newlines are always applied around the whole block (e.g. ```)
  // - block formatters are not applied on empty lines, unless:
  //    - they have passed a function to generate the format for each line (e.g. ordered lists)
  //    - all the lines are empty, in which case we apply the formatter once, at the start
  const addFmt = (fmt, text, isInlineFormatter = false) => {
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
  };

  const makeMarkdownToolbarHandlerInline = (handler, fmt) => {
    toolbar.addHandler(handler, (value) => {
      if (!isMarkdownMode()) return quill.format(handler, value);
      const { index, length } = quill.getSelection();
      const text = quill.getText();

      if (length > 0) {
        const textBefore = text.slice(0, index);
        const textAfter = text.slice(index + length);
        const formattedText = addFmt(
          fmt,
          text.slice(index, index + length),
          true
        );
        quill.setText(textBefore + formattedText + textAfter);
        quill.setSelection(index, formattedText.length);
      } else {
        quill.insertText(index, fmt.trimLeft()); // trim fmt, so we don't end up with extra newline at the start
        quill.setSelection(index + fmt.trimLeft().length, length);
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
      if (!isMarkdownMode()) return quill.format(handler, value);

      const { index, length } = quill.getSelection();
      const text = quill.getText();
      const fmt = typeof fmtOption === 'string' ? fmtOption : fmtOption[value];
      if (length > 0) {
        // If there is a selection, insert (newline + fmt) before the selection
        // Then set the selection at the end of the line
        quill.setText(
          text.slice(0, index) +
            addFmt(fmt, text.slice(index, index + length)) +
            text.slice(index + length).trimRight()
        );
        quill.setSelection(
          text.slice(0, index).length +
            addFmt(fmt, text.slice(index, index + length)).length
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
          addFmt(
            fmt,
            (thisBefore.length > 0 ? thisBefore[0] : '') +
              (thisAfter.length > 0 ? thisAfter[0] : '')
          ) +
          (linesAfter.length === 0 ? '' : '\n');
        const result = textBefore + formattedLine + textAfter;
        quill.setText(result);
        quill.setSelection(textBefore.length + formattedLine.length - 1);
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
  const defaultLinkHandler = quill.theme.modules.toolbar.handlers.link;
  toolbar.addHandler('link', (value) => {
    if (!isMarkdownMode()) return defaultLinkHandler.call({ quill }, value);

    const { index, length } = quill.getSelection();
    const text = quill.getText();

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
      quill.deleteText(index, length);
      quill.insertText(
        index,
        linkPre + selectedText + linkBetween + linkHref + linkPost
      );
      quill.setSelection(
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
        quill.insertText(index, linkPre + linkHref + linkPost);
        quill.setSelection(index + linkPre.length, linkHref.length);
      } else {
        // Insert link with href
        const linkPre = `[${linkText}](`;
        const linkPost = ')';
        quill.insertText(index, linkPre + linkHref + linkPost);
        quill.setSelection(index + linkPre.length, linkHref.length);
      }
    }
  });

  // Set up preview button in toolbar
  $editor
    .parent()
    .find('button.ql-preview')
    .on('click', (e) => {
      const markdownMode = isMarkdownMode();
      app.modals.create({
        modal: PreviewModal,
        data: {
          doc: markdownMode
            ? quill.getText()
            : JSON.stringify(quill.getContents()),
        },
      });
    });

  // Save editor content in localStorage
  state.unsavedChanges = new Delta();
  quill.on('text-change', (delta, oldDelta, source) => {
    state.unsavedChanges = state.unsavedChanges.compose(delta);
    // Log that the quill doc has been altered, so that
    // newThread draft system prompts w/ save confirmation modal
    if (source === 'user' && !state.alteredText) {
      state.alteredText = true;
      m.redraw();
    }
    // Log that the editor isBlank status has changed, to change
    // enabled/disabled state of submission button
    if (state.enableSubmission && quill.editor.isBlank()) {
      state.enableSubmission = false;
      m.redraw();
    } else if (!state.enableSubmission && !quill.editor.isBlank()) {
      state.enableSubmission = true;
      m.redraw();
    }
  });

  setInterval(() => {
    if (state.unsavedChanges.length() > 0) {
      if (quill.isEnabled()) {
        // Save the entire updated text to localStorage
        const data = JSON.stringify(quill.getContents());
        localStorage.setItem(
          `${app.activeChainId()}-${editorNamespace}-storedText`,
          data
        );
        state.unsavedChanges = new Delta();
      }
    }
  }, 2500);

  return quill;
};

interface IQuillEditorAttrs {
  contentsDoc?;
  imageUploader?;
  oncreateBind;
  placeholder?: string;
  tabindex?: number;
  theme?: string;
  onkeyboardSubmit?;
  editorNamespace: string;
}

interface IQuillEditorState {
  editor;
  markdownMode;
  uploading?: boolean;
  // for localStorage drafts:
  beforeunloadHandler;
  alteredText: boolean;
  enableSubmission: boolean;
  unsavedChanges;
  clearUnsavedChanges;
}

const QuillEditor: m.Component<IQuillEditorAttrs, IQuillEditorState> = {
  oncreate: (vnode) => {
    // Only bind the alert if we are actually trying to persist the user's changes
    if (!vnode.attrs.contentsDoc) {
      vnode.state.beforeunloadHandler = () => {
        if (
          vnode.state.unsavedChanges &&
          vnode.state.unsavedChanges.length() > 0
        ) {
          return 'There are unsaved changes. Are you sure you want to leave?';
        }
      };
      $(window).on('beforeunload', vnode.state.beforeunloadHandler);
    }
  },
  onremove: (vnode) => {
    if (!vnode.attrs.contentsDoc) {
      $(window).off('beforeunload', vnode.state.beforeunloadHandler);
    }
  },
  view: (vnode) => {
    const theme = vnode.attrs.theme || 'snow';
    const {
      imageUploader,
      placeholder,
      tabindex,
      editorNamespace,
      onkeyboardSubmit,
    } = vnode.attrs;
    const oncreateBind = vnode.attrs.oncreateBind || (() => null);
    // If this component is running for the first time, and the parent has not provided contentsDoc,
    // try to load it from the drafts and also set markdownMode appropriately
    let contentsDoc = vnode.attrs.contentsDoc;
    if (
      !contentsDoc &&
      !vnode.state.markdownMode &&
      localStorage.getItem(
        `${app.activeChainId()}-${editorNamespace}-storedText`
      ) !== null
    ) {
      try {
        contentsDoc = JSON.parse(
          localStorage.getItem(
            `${app.activeChainId()}-${editorNamespace}-storedText`
          )
        );
        if (!contentsDoc.ops) throw new Error();
        vnode.state.markdownMode = false;
      } catch (e) {
        contentsDoc = localStorage.getItem(
          `${app.activeChainId()}-${editorNamespace}-storedText`
        );
        vnode.state.markdownMode = true;
      }
    } else if (vnode.state.markdownMode === undefined) {
      if (localStorage.getItem(`${editorNamespace}-markdownMode`) === 'true') {
        vnode.state.markdownMode = true;
      } else if (
        localStorage.getItem(`${editorNamespace}-markdownMode`) === 'false'
      ) {
        vnode.state.markdownMode = false;
      } else {
        // Otherwise, just set vnode.state.markdownMode based on the app setting
        vnode.state.markdownMode = !!app.user?.disableRichText;
      }
    }

    // Set vnode.state.clearUnsavedChanges on first initialization
    if (vnode.state.clearUnsavedChanges === undefined) {
      vnode.state.clearUnsavedChanges = () => {
        localStorage.removeItem(`${editorNamespace}-markdownMode`);
        localStorage.removeItem(
          `${app.activeChainId()}-${editorNamespace}-storedText`
        );
        localStorage.removeItem(
          `${app.activeChainId()}-${editorNamespace}-storedTitle`
        );
        if (
          localStorage.getItem(`${app.activeChainId()}-post-type`) === 'Link'
        ) {
          localStorage.removeItem(`${app.activeChainId()}-new-link-storedLink`);
        }
        localStorage.removeItem(`${app.activeChainId()}-post-type`);
      };
    }
    return m(
      '.QuillEditor',
      {
        class: vnode.state.markdownMode ? 'markdown-mode' : 'richtext-mode',
        oncreate: (childVnode) => {
          const $editor = $(childVnode.dom).find('.quill-editor');
          vnode.state.editor = instantiateEditor(
            $editor,
            theme,
            true,
            imageUploader,
            placeholder,
            editorNamespace,
            vnode.state,
            onkeyboardSubmit
          );
          // once editor is instantiated, it can be updated with a tabindex
          $(childVnode.dom).find('.ql-editor').attr('tabindex', tabindex);
          if (contentsDoc && typeof contentsDoc === 'string') {
            const res = vnode.state.editor.setText(contentsDoc);
            vnode.state.markdownMode = true;
          } else if (contentsDoc && typeof contentsDoc === 'object') {
            const res = vnode.state.editor.setContents(contentsDoc);
            vnode.state.markdownMode = false;
          }
          oncreateBind(vnode.state);
        },
      },
      [
        m('.quill-editor'),
        theme !== 'bubble' &&
          m('.type-selector', [
            vnode.state.markdownMode
              ? m(Tooltip, {
                  trigger: m(Tag, {
                    label: 'Markdown',
                    size: 'xs',
                    onclick: (e) => {
                      if (!vnode.state.markdownMode) return;
                      const cachedContents = vnode.state.editor.getContents();
                      // switch editor to rich text
                      vnode.state.markdownMode = false;
                      const $editor = $(e.target)
                        .closest('.QuillEditor')
                        .find('.quill-editor');
                      vnode.state.editor.container.tabIndex = tabindex;
                      vnode.state.editor = instantiateEditor(
                        $editor,
                        theme,
                        true,
                        imageUploader,
                        placeholder,
                        editorNamespace,
                        vnode.state,
                        onkeyboardSubmit
                      );
                      // once editor is instantiated, it can be updated with a tabindex
                      $(e.target)
                        .closest('.QuillEditor')
                        .find('.ql-editor')
                        .attr('tabindex', tabindex);
                      vnode.state.editor.setContents(cachedContents);
                      vnode.state.editor.setSelection(
                        vnode.state.editor.getText().length - 1
                      );
                      vnode.state.editor.focus();

                      // try to save setting
                      if (app.isLoggedIn()) {
                        SettingsController.disableRichText(false);
                      }
                    },
                  }),
                  content: m('.quill-editor-tooltip', 'Click for rich text'),
                })
              : m(Tooltip, {
                  trigger: m(Tag, {
                    label: 'Rich text',
                    size: 'xs',
                    onclick: async (e) => {
                      if (vnode.state.markdownMode) return;

                      // confirm before removing formatting and switching to markdown mode
                      // first, we check if removeFormat() actually does anything; then we ask the user to confirm
                      let confirmed = false;
                      let cachedContents = vnode.state.editor.getContents();
                      vnode.state.editor.removeFormat(
                        0,
                        vnode.state.editor.getText().length - 1
                      );
                      if (
                        vnode.state.editor.getContents().ops.length ===
                        cachedContents.ops.length
                      ) {
                        confirmed = true;
                      } else {
                        vnode.state.editor.setContents(cachedContents);
                        vnode.state.editor.setSelection(
                          vnode.state.editor.getText().length - 1
                        );
                      }
                      if (!confirmed) {
                        confirmed = await confirmationModalWithText(
                          'All formatting and images will be lost. Continue?'
                        )();
                      }
                      if (!confirmed) return;

                      // remove formatting, switch editor to markdown
                      vnode.state.editor.removeFormat(
                        0,
                        vnode.state.editor.getText().length - 1
                      );
                      cachedContents = vnode.state.editor.getContents();
                      vnode.state.markdownMode = true;
                      const $editor = $(e.target)
                        .closest('.QuillEditor')
                        .find('.quill-editor');
                      vnode.state.editor = instantiateEditor(
                        $editor,
                        theme,
                        true,
                        imageUploader,
                        placeholder,
                        editorNamespace,
                        vnode.state,
                        onkeyboardSubmit
                      );
                      // once editor is instantiated, it can be updated with a tabindex
                      $(e.target)
                        .closest('.QuillEditor')
                        .find('.ql-editor')
                        .attr('tabindex', tabindex);
                      vnode.state.editor.container.tabIndex = tabindex;
                      vnode.state.editor.setContents(cachedContents);
                      vnode.state.editor.setSelection(
                        vnode.state.editor.getText().length - 1
                      );
                      vnode.state.editor.focus();

                      // try to save setting
                      if (app.isLoggedIn()) {
                        SettingsController.disableRichText(true);
                      }
                    },
                  }),
                  content: m('.quill-editor-tooltip', 'Click for Markdown'),
                }),
          ]),
        m('.preview-button-wrap', [
          m(Tag, {
            label: m('.preview-button', [
              m(CWIcon, { iconName: 'search', iconSize: 'small ' }),
              m('span', 'Preview'),
            ]),
            size: 'xs',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({
                modal: PreviewModal,
                data: {
                  doc: vnode.state.markdownMode
                    ? vnode.state.editor.getText()
                    : JSON.stringify(vnode.state.editor.getContents()),
                },
              });
            },
          }),
        ]),
      ]
    );
  },
};

export default QuillEditor;
