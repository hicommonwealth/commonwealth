// Modified for better handling of code blocks & fenced code blocks.
// <hr> element has also been removed.
// <h1> through <h3> are the only headers.
// Added 'suppress' option to turn off auto-formatting in Markdown mode
// Fixed handling of bold (** or __)

 // Quill.js Plugin - Markdown Shortcuts
 // This is a module for the Quill.js WYSIWYG editor (https://quilljs.com/)
 // which converts text entered as markdown to rich text.
 //
 // v0.0.5
 //
 // Author: Patrick Lee (me@patricklee.nyc)
 //
 // (c) Copyright 2017 Patrick Lee (me@patricklee.nyc).
 // Permission is hereby granted, free of charge, to any person obtaining a copy
 // of this software and associated documentation files (the "Software"), to deal
 // in the Software without restriction, including without limitation the rights
 // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 // copies of the Software, and to permit persons to whom the Software is
 // furnished to do so, subject to the following conditions:
 //
 // The above copyright notice and this permission notice shall be included in
 // all copies or substantial portions of the Software.
 //
 // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 // THE SOFTWARE.
 //
import Quill from 'quill';

export class MarkdownShortcuts {
  constructor (quill, options) {
    this.quill = quill
    this.options = options

    this.ignoreTags = ['PRE']
    this.matches = [
      {
        name: 'header',
        pattern: /^(#){1,2}\s/g,
        action: (text, selection, pattern) => {
          var match = pattern.exec(text)
          if (!match) return
          const size = match[0].length
          // Need to defer this action https://github.com/quilljs/quill/issues/1134
          setTimeout(() => {
            this.quill.formatLine(selection.index, 0, 'header', size - 1, 'api')
            this.quill.deleteText(selection.index - size, size, 'api')
          }, 0)
        }
      },
      {
        name: 'blockquote',
        pattern: /^(>)\s/g,
        action: (text, selection) => {
          // Need to defer this action https://github.com/quilljs/quill/issues/1134
          setTimeout(() => {
            this.quill.formatLine(selection.index, 1, 'blockquote', true, 'api')
            this.quill.deleteText(selection.index - 2, 2, 'api')
          }, 0)
        }
      },
      {
        name: 'code-block',
        pattern: /^`{3}/g,
        action: (text, selection) => {
          // Need to defer this action https://github.com/quilljs/quill/issues/1134
          setTimeout(() => {
            this.quill.formatLine(selection.index, 1, 'code-block', true, 'api')
            this.quill.deleteText(selection.index - 3, 3, 'api')
          }, 0)
        }
      },
      {
        // bolditalic now handles bold, italic, and bold italic
        name: 'bolditalic',
        pattern: /((?:\*|_){1,3})(.+?)((?:\*|_){1,3})/g,
        action: (text, selection, pattern, lineStart) => {
          let match = pattern.exec(text)

          const annotatedText = match[0]
          const openingDelimiter = match[1]
          const matchedText = match[2]
          const closingDelimiter = match[3]
          const startIndex = lineStart + match.index

          if (text.match(/^([*_ \n]+)$/g)) return
          if (matchedText[0] === ' ' || matchedText[matchedText.length - 1] === ' ') return
          if (matchedText[0] === '*' || matchedText[0] === '_') return
          if (openingDelimiter !== closingDelimiter) return
          if (openingDelimiter !== closingDelimiter.split('').reverse().join('')) return

          setTimeout(() => {
            const formatting =
                  (openingDelimiter === '*' || openingDelimiter === '_') ? {italic: true} :
                  (openingDelimiter === '**' || openingDelimiter === '__') ? {bold: true} :
                  {bold: true, italic: true};
            this.quill.deleteText(startIndex, annotatedText.length)
            this.quill.insertText(startIndex, matchedText, formatting)
            this.quill.format('bold', false)
            this.quill.format('italic', false)
          }, 0)
        }
      },
      {
        name: 'strikethrough',
        pattern: /(?:~~)(.+?)(?:~~)/g,
        action: (text, selection, pattern, lineStart) => {
          let match = pattern.exec(text)

          const annotatedText = match[0]
          const matchedText = match[1]
          const startIndex = lineStart + match.index

          if (text.match(/^([*_ \n]+)$/g)) return
          if (matchedText[0] === ' ' || matchedText[matchedText.length - 1] === ' ') return

          setTimeout(() => {
            this.quill.deleteText(startIndex, annotatedText.length)
            this.quill.insertText(startIndex, matchedText, {strike: true})
            this.quill.format('strike', false)
          }, 0)
        }
      },
      {
        name: 'code',
        pattern: /(?:`)(.+?)(?:`)/g,
        action: (text, selection, pattern, lineStart) => {
          let match = pattern.exec(text)

          const annotatedText = match[0]
          const matchedText = match[1]
          const startIndex = lineStart + match.index

          if (text.match(/^([*_ \n]+)$/g)) return
          if (matchedText === '`') return
          if (matchedText[0] === ' ' || matchedText[matchedText.length - 1] === ' ') return

          setTimeout(() => {
            this.quill.deleteText(startIndex, annotatedText.length)
            this.quill.insertText(startIndex, matchedText, {code: true})
            this.quill.format('code', false)
            this.quill.insertText(this.quill.getSelection(), ' ')
          }, 0)
        }
      },
      {
        name: 'image',
        pattern: /(?:!\[(.+?)\])(?:\((.+?)\))/g,
        action: (text, selection, pattern) => {
          const startIndex = text.search(pattern)
          const matchedText = text.match(pattern)[0]
          // const hrefText = text.match(/(?:!\[(.*?)\])/g)[0]
          const hrefLink = text.match(/(?:\((.*?)\))/g)[0]
          const start = selection.index - matchedText.length - 1
          if (startIndex !== -1) {
            setTimeout(() => {
              this.quill.deleteText(start, matchedText.length, 'api')
              this.quill.insertEmbed(start, 'image', hrefLink.slice(1, hrefLink.length - 1), 'api')
            }, 0)
          }
        }
      },
      {
        name: 'link',
        pattern: /(?:\[(.+?)\])(?:\((.+?)\))/g,
        action: (text, selection, pattern) => {
          const startIndex = text.search(pattern)
          const matchedText = text.match(pattern)[0]
          const hrefText = text.match(/(?:\[(.*?)\])/g)[0]
          const hrefLink = text.match(/(?:\((.*?)\))/g)[0]
          const start = selection.index - matchedText.length - 1
          if (startIndex !== -1) {
            setTimeout(() => {
              this.quill.deleteText(start, matchedText.length, 'api')
              this.quill.insertText(start, hrefText.slice(1, hrefText.length - 1), 'link', hrefLink.slice(1, hrefLink.length - 1), 'api')
            }, 0)
          }
        }
      }
    ]

    // Handler that looks for insert deltas that match specific characters
    this.quill.on('text-change', (delta, oldContents, source) => {
      for (let i = 0; i < delta.ops.length; i++) {
        if (delta.ops[i].hasOwnProperty('insert')) {
          if ([' ', '`', '*', '_', '~'].indexOf(delta.ops[i].insert) !== -1) {
            this.onKey()
          } else if (delta.ops[i].insert === '\n') {
            this.onEnter()
          }
        }
      }
    })
  }

  isValid (text, tagName) {
    return (
      typeof text !== 'undefined' &&
      text &&
      this.ignoreTags.indexOf(tagName) === -1
    )
  }

  onKey () {
    const selection = this.quill.getSelection()
    if (!selection) return
    if (this.options.suppress && this.options.suppress()) return
    const [line, offset] = this.quill.getLine(selection.index)
    const text = line.domNode.textContent
    const lineStart = selection.index - offset
    if (this.isValid(text, line.domNode.tagName)) {
      for (let match of this.matches) {
        const matchedText = text.match(match.pattern)
        if (matchedText) {
          // We need to replace only matched text not the whole line
          match.action(text, selection, match.pattern, lineStart)
          return
        }
      }
    }
  }

  onEnter () {
    let selection = this.quill.getSelection()
    if (!selection) return
    if (this.options.suppress && this.options.suppress()) return
    const [line, offset] = this.quill.getLine(selection.index)
    const text = line.domNode.textContent + ' '
    const lineStart = selection.index - offset
    selection.length = selection.index++
    if (this.isValid(text, line.domNode.tagName)) {
      for (let match of this.matches) {
        const matchedText = text.match(match.pattern)
        if (matchedText) {
          match.action(text, selection, match.pattern, lineStart)
          return
        }
      }
    }
  }
}
