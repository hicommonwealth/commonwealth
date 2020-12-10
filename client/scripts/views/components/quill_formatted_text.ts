/* eslint-disable no-restricted-syntax */

import 'components/quill_formatted_text.scss';

import m from 'mithril';
import { Icon, Icons } from 'construct-ui';
import { loadScript } from 'helpers';
import { preprocessQuillDeltaForRendering } from '../../../../shared/utils';

const renderQuillDelta = (delta, hideFormatting = false, collapse = false) => {
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
        && groups[groups.length - 1].parents[0].attributes.list) {
        // && parent.attributes.list === groups[groups.length - 1].parents[0].attributes.list
        // && parent.attributes.indent === groups[groups.length - 1].parents[0].attributes.indent) {
      groups[groups.length - 1].parents.push(parent);
    } else if (parent.attributes && parent.attributes.list) {
      groups.push({ listtype: parent.attributes.list, parents: [parent] });
    } else {
      groups.push({ parents: [parent] });
    }
  });

  // then, render each group
  const getGroupTag = (group) => {
    if (collapse) return 'span';
    if (group.listtype === 'bullet') return 'ul';
    if (group.listtype === 'ordered') return 'ol';
    if (group.listtype === 'checked' || group.listtype === 'unchecked') return 'ul.checklist';
    return 'div';
  };
  const getParentTag = (parent) => {
    if (collapse) return 'span';
    if (parent.attributes?.list === 'bullet') return 'li';
    if (parent.attributes?.list === 'ordered') return 'li';
    if (parent.attributes?.list === 'checked') return 'li.checked';
    if (parent.attributes?.list === 'unchecked') return 'li.unchecked';
    return 'div';
  };
  // multiple list groups should be consolidated, so numbering is preserved even when ordered lists are broken
  const consolidateOrderedLists = (groups) => {
    const result = [];

    let run = [];
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].listtype) {
        run.push(groups[i])
      } else {
        if (run.length > 0) {
          result.push(run);
          run = [];
        }
        result.push(groups[i])
      }
    }
    if (run.length > 0) {
      result.push(run);
    }

    return result;
  };
  return (hideFormatting || collapse)
    ? groups.map((group) => {
      const wrapGroupForHiddenFormatting = (content) => {
        return m(`${getGroupTag(group)}.hidden-formatting`, content);
      };
      return wrapGroupForHiddenFormatting(group.parents.map((parent) => {
        return m(`${getParentTag(parent)}.hidden-formatting-inner`, [
          parent.children.map((child) => {
            if (child.insert?.mention)
              return m('span.mention', child.insert.mention.denotationChar + child.insert.mention.value);
            if (child.insert?.image) return;
            if (child.insert?.twitter) return;
            if (child.insert?.video) return;
            if (child.attributes?.link) return m('a', {
              href: child.attributes.link,
              target: '_blank',
              noreferrer: 'noreferrer',
              noopener: 'noopener',
            }, `${child.insert}`);
            return m('span', `${child.insert}`);
          })
        ]);
      }));
    }) : consolidateOrderedLists(groups).map((group) => {
      const renderChild = (child) => {
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
                // eslint-disable-next-line
                (<any>window).twttr?.widgets?.load();
              }, 1);
            });
          } else {
            setTimeout(() => {
              // eslint-disable-next-line
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
            onclick: (e) => {
              // alert(child.insert.mention.id)
            }
          }, child.insert.mention.denotationChar + child.insert.mention.value);
        } else if (child.attributes?.link) {
          result = m('a', {
            href: child.attributes.link,
            target: '_blank',
            noreferrer: 'noreferrer',
            noopener: 'noopener',
          }, `${child.insert}`);
        } else {
          result = m('span', `${child.insert}`);
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
      };
      const renderParent = (parent) => {
        // render empty parent nodes as .between-paragraphs
        if (!parent.attributes && parent.children.length === 1 && parent.children[0].insert === '\n') {
          return m('.between-paragraphs');
        }
        // render normal parent nodes with content
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
                            : parent.attributes && parent.attributes.list === 'checked' ? 'li.checked'
                              : parent.attributes && parent.attributes.list === 'unchecked' ? 'li.unchecked'
                                : 'div',
        parent.children.map(renderChild));
      };
      // special handler for lists, which need to be un-flattened and turned into a tree
      const renderListGroup = (group) => {
        const temp = []; // accumulator for potential parent tree nodes; will grow to the maximum depth of the tree
        group.parents.forEach((parent) => {
          const tag = getParentTag(parent);
          const content = parent.children.map(renderChild);
          const indent = parent.attributes.indent || 0;

          if (indent >= temp.length) { // indent
            temp.push([]);
            temp[temp.length - 1].push({ tag, content, indent });
          } else if (indent === temp.length - 1) { // keep same
            temp[indent].push({ tag, content, indent });
          } else if (indent < temp.length - 1) { // outdent and unwind
            while (indent < temp.length - 1) {
              const outdentBuffer = temp[temp.length - 2];
              outdentBuffer[outdentBuffer.length - 1].content.push(
                m(getGroupTag(group), temp.pop().map(({ tag, content }) => {
                  return m(tag, content);
                }))
              );
            }
            temp[temp.length - 1].push({ tag, content, indent });
          }
        });

        // fully unwind and collect stray children
        while (temp.length > 1) {
          const outdentBuffer = temp[temp.length - 2];
          outdentBuffer[outdentBuffer.length - 1].content.push(
            m(getGroupTag(group), temp.pop().map(({ tag, content }) => {
              return m(tag, content);
            }))
          );
        }
        return m(getGroupTag(group), temp[0].map(({ tag, content }) => {
          return m(tag, content);
        }));
      };
      if (group.length) return group.map(renderListGroup);
      else return group.parents.map(renderParent);
    });
};

const QuillFormattedText : m.Component<{ doc, hideFormatting?, collapse? }> = {
  view: (vnode) => {
    const { doc, hideFormatting, collapse } = vnode.attrs;

    return m('.QuillFormattedText', {
      class: collapse ? 'collapsed' : '',
      oncreate: (vvnode) => {
        if (!(<any>window).twttr) loadScript('//platform.twitter.com/widgets.js')
          .then(() => { console.log('Twitter Widgets loaded'); });
      }
    }, renderQuillDelta(doc, hideFormatting, collapse));
  }
};

export default QuillFormattedText;
