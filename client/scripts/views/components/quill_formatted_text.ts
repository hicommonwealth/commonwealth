import 'components/quill_formatted_text.scss';

import { default as $ } from 'jquery';
import { default as m } from 'mithril';
import { stringUpperFirst } from '@polkadot/util';
import { loadScript } from '../../helpers';

interface IQuillJSON {
  ops: IQuillOps[];
}

interface IQuillOps {
  insert: string;
  attributes: string;
}

// Truncate a Quill document to the first `length` characters.
//
// If non-text elements are in the document, they will remain by
// default.
export const sliceQuill = (json: IQuillJSON, length: number) => {
  let count = 0;
  const completeObjects = [];
  const truncatedObj = [];
  for (const ele of json.ops) {
    if (count >= length) break;
    const text = ele.insert;
    if (count + text.length > length) {
      const fullText = text;
      ele.insert = `${text.slice(0, length - count)}\n`;
      truncatedObj.push(ele);
      count += fullText.length;
    } else {
      completeObjects.push(ele);
      count += text.length;
    }
  }
  return ({ ops: completeObjects.concat(truncatedObj) });
};

const preprocessQuillDeltaForRendering = (nodes) => {
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

const renderQuillDelta = (delta, hideFormatting = false) => {
  // convert quill delta into a tree of {block -> parent -> child} nodes
  // blocks are <ul> <ol>, parents are all other block nodes, children are inline nodes

  // first, concatenate parent nodes for <ul> and <ol> into groups
  const groups = [];
  preprocessQuillDeltaForRendering(delta.ops).forEach((parent) => {
    // if the last parent was a <ul> or <ol> with the same attributes.list,
    // concatenate the current parent's children onto the last instead
    if (groups.length !== 0
        && groups[groups.length - 1].parents[0].attributes
        && parent.attributes?.list
        && groups[groups.length - 1].parents[0].attributes.list
        && parent.attributes.list === groups[groups.length - 1].parents[0].attributes.list) {
      groups[groups.length - 1].parents.push(parent);
    } else if (parent.attributes && parent.attributes.list) {
      groups.push({ listtype: parent.attributes.list, parents: [parent] });
    } else {
      groups.push({ parents: [parent] });
    }
  });

  // then, render each group
  return hideFormatting
    ? groups.map((group) => {
      return m('span', group.parents.map((parent) => {
        return parent.children.map((child) => {
          if (child.insert?.image) return;
          if (child.insert?.mention) return m('span', child.insert.mention.value);
          if (child.insert?.twitter || child.insert?.video) {
            const embedType = Object.keys(child.insert)[0];
            return m('span', `[${stringUpperFirst(embedType)} embed]`);
          }
          return m('span', child.insert.toString());
        });
      }));
    })
    : groups.map((group) => {
      const groupTag = group.listtype === 'bullet'
        ? 'ul'
        : group.listtype === 'ordered'
          ? 'ol'
          : 'div';
      return m(groupTag, group.parents.map((parent) => {
        // render empty parent nodes as .between-paragraphs
        if (!parent.attributes && parent.children.length === 1 && parent.children[0].insert === '\n') {
          return m('.between-paragraphs');
        }
        // render normal divs with content
        const children = parent.children.map((child) => {
          // handle images
          if (child.insert?.image) {
            return m('img', {
              src: child.insert?.image,
            });
          }
          // handle video
          if (child.insert?.video) {
            return m('div', [
              m('iframe', {
                frameborder: 0,
                allowfullscreen: true,
                src: child.insert?.video
              }),
              m('br')
            ]);
          }
          // handle tweets
          if (child.insert?.twitter) {
            const id = child.insert.twitter.id;
            if (!(<any>window).twttr) {
              loadScript('//platform.twitter.com/widgets.js').then(() => {
                setTimeout(() => {
                  (<any>window).twttr?.widgets?.load();
                }, 1);
              });
            } else {
              setTimeout(() => {
                (<any>window).twttr?.widgets?.load();
              }, 1);
            }
            const url = `https://twitter.com/user/status/${id}`;
            return m('blockquote', {
              class: 'twitter-tweet',
            }, [
              m('a', {
                tabindex: -1,
                href: url
              })
            ]);
          }
          // handle text nodes
          let result;
          if (child.insert?.mention) {
            result = m('span.mention', {
              onclick: (e) => alert(child.insert.mention.id)
            }, child.insert.mention.denotationChar + child.insert.mention.value);
          } else if (child.attributes?.link) {
            result = m('a', {
              href: child.attributes.link,
              target: '_blank',
              noreferrer: 'noreferrer',
              noopener: 'noopener',
            }, child.insert?.toString());
          } else {
            result = m('span', child.insert?.toString());
          }
          Object.entries(child.attributes || {}).forEach(([k, v]) => {
            if ((k !== 'color' && k !== 'background') && v !== true) return;
            switch (k) {
              case 'bold': result = m('strong', result); return;
              case 'italic': result = m('em', result); return;
              case 'strike': result = m('s', result); return;
              case 'underline': result = m('u', result); return;
              case 'code': result = m('code', result); return;
              case 'added': result = m('span.added', result); return;
              case 'deleted': result = m('span.deleted', result); return;
              default: result = m('span', result);
            }
          });
          return result;
        });
        return m(parent.attributes && parent.attributes.blockquote ? 'blockquote'
          : parent.attributes && parent.attributes['code-block'] ? 'pre'
            : parent.attributes && parent.attributes.header === 1 ? 'h1'
              : parent.attributes && parent.attributes.header === 2 ? 'h2'
                : parent.attributes && parent.attributes.header === 3 ? 'h3'
                  : parent.attributes && parent.attributes.header === 4 ? 'h4'
                    : parent.attributes && parent.attributes.header === 5 ? 'h5'
                      : parent.attributes && parent.attributes.header === 6 ? 'h6'
                        : parent.attributes && parent.attributes.list === 'bullet' ? 'li'
                          : parent.attributes && parent.attributes.list === 'ordered' ? 'li'
                            : 'div',
        children);
      }));
    });
};

const QuillFormattedText : m.Component<{ doc, hideFormatting?, collapsed? }, { suppressFadeout }> = {
  view: (vnode) => {
    return m('.QuillFormattedText', {
      class: (vnode.attrs.collapsed ? 'collapsed' : '') + (vnode.state.suppressFadeout ? ' suppress-fadeout' : ''),
      oncreate: (vnode2) => {
        if (!(<any>window).twttr) loadScript('//platform.twitter.com/widgets.js')
          .then(() => { console.log('Twitter Widgets loaded'); });
        const height = $(vnode2.dom).height();
        vnode.state.suppressFadeout = height < 120;
        setTimeout(() => m.redraw());
      }
    }, renderQuillDelta(vnode.attrs.doc, vnode.attrs.hideFormatting));
  }
};

export default QuillFormattedText;
