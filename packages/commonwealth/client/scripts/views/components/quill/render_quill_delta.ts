import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
} from 'mithrilInterop';

import { loadScript } from 'helpers';
import { preprocessQuillDeltaForRendering } from '../../../../../shared/utils';

export const renderQuillDelta = (
  delta,
  hideFormatting = false,
  collapse = false,
  openLinksInNewTab = false
) => {
  // convert quill delta into a tree of {block -> parent -> child} nodes
  // blocks are <ul> <ol>, parents are all other block nodes, children are inline nodes

  // trim beginning content...
  if (typeof delta.ops[0]?.insert === 'string') {
    delta.ops[0].insert = delta.ops[0].insert.trimLeft();
  }

  // first, concatenate parent nodes for <ul> and <ol> into groups
  const groups = [];
  preprocessQuillDeltaForRendering(delta.ops).forEach((parent) => {
    // if the last parent was a <ul> or <ol> with the same attributes.list,
    // concatenate the current parent's children onto the last instead
    if (
      groups.length !== 0 &&
      groups[groups.length - 1].parents[0].attributes &&
      parent.attributes?.list &&
      groups[groups.length - 1].parents[0].attributes.list
    ) {
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
    if (group.listtype === 'checked' || group.listtype === 'unchecked')
      return 'ul.checklist';
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
  const consolidateOrderedLists = (_groups) => {
    const result = [];

    let run = [];

    for (let i = 0; i < _groups.length; i++) {
      if (_groups[i].listtype) {
        run.push(_groups[i]);
      } else {
        if (run.length > 0) {
          result.push(run);
          run = [];
        }
        result.push(_groups[i]);
      }
    }
    if (run.length > 0) {
      result.push(run);
    }

    return result;
  };

  return hideFormatting || collapse
    ? groups.map((group, i) => {
        const wrapGroupForHiddenFormatting = (content) => {
          return render(
            `${getGroupTag(group)}.hidden-formatting`,
            { key: i },
            content
          );
        };
        return wrapGroupForHiddenFormatting(
          group.parents.map((parent, ii) => {
            return render(
              `${getParentTag(parent)}.hidden-formatting-inner`,
              { key: ii },
              [
                parent.children.map((child, iii) => {
                  if (child.insert?.mention)
                    return render(
                      'span.mention',
                      { key: iii },
                      child.insert.mention.denotationChar +
                        child.insert.mention.value
                    );
                  if (child.insert?.image) return;
                  if (child.insert?.twitter) return;
                  if (child.insert?.video) return;
                  if (child.attributes?.link)
                    return render(
                      'a',
                      {
                        key: iii,
                        href: child.attributes.link,
                        target: openLinksInNewTab ? '_blank' : '',
                        noreferrer: 'noreferrer',
                        noopener: 'noopener',
                        onClick: (e) => {
                          if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey)
                            return;
                          if (
                            child.attributes.link.startsWith(
                              `${document.location.origin}/`
                            )
                          ) {
                            // don't open a new window if the link is on Commonwealth
                            e.preventDefault();
                            e.stopPropagation();
                            setRoute(child.attributes.link);
                          }
                        },
                      },
                      `${child.insert}`
                    );
                  if (child.insert.match(/[A-Za-z0-9]$/)) {
                    // add a period and space after lines that end on a word or
                    // number, like Google does in search previews
                    return render('span', { key: iii }, `${child.insert}. `);
                  } else {
                    return render('span', { key: iii }, `${child.insert}`);
                  }
                }),
              ]
            );
          })
        );
      })
    : consolidateOrderedLists(groups).map((group, i) => {
        const renderChild = (child) => {
          // handle images
          if (child.insert?.image) {
            return render('img', {
              key: i,
              src: child.insert?.image,
            });
          }
          // handle video
          if (child.insert?.video) {
            return render(
              'div',
              {
                key: i,
              },
              [
                render('iframe', {
                  frameborder: 0,
                  allowfullscreen: true,
                  src: child.insert?.video,
                }),
                render('br'),
              ]
            );
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
            return render(
              'blockquote',
              {
                key: i,
                class: 'twitter-tweet',
              },
              [
                render('a', {
                  tabIndex: -1,
                  href: url,
                }),
              ]
            );
          }
          // handle text nodes
          let result;
          if (child.insert?.mention) {
            result = render(
              'span.mention',
              {
                onClick: () => {
                  // alert(child.insert.mention.id)
                },
              },
              child.insert.mention.denotationChar + child.insert.mention.value
            );
          } else if (child.attributes?.link) {
            result = render(
              'a',
              {
                href: child.attributes.link,
                target: '_blank',
                noreferrer: 'noreferrer',
                noopener: 'noopener',
                onClick: (e) => {
                  if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return;
                  if (
                    child.attributes.link.startsWith(
                      `${document.location.origin}/`
                    )
                  ) {
                    // don't open a new window if the link is on Commonwealth
                    e.preventDefault();
                    e.stopPropagation();
                    setRoute(child.attributes.link);
                  }
                },
              },
              `${child.insert}`
            );
          } else {
            result = render('span', `${child.insert}`);
          }
          Object.entries(child.attributes || {}).forEach(([k, v]) => {
            if (k !== 'color' && k !== 'background' && v !== true) return;
            switch (k) {
              case 'bold':
                result = render('strong', result);
                return;
              case 'italic':
                result = render('em', result);
                return;
              case 'strike':
                result = render('s', result);
                return;
              case 'underline':
                result = render('u', result);
                return;
              case 'code':
                result = render('code', result);
                return;
              case 'added':
                result = render('span.added', result);
                return;
              case 'deleted':
                result = render('span.deleted', result);
                return;
              default:
                result = render('span', result);
            }
          });
          return result;
        };
        const renderParent = (parent) => {
          // render empty parent nodes as .between-paragraphs
          if (
            !parent.attributes &&
            parent.children.length === 1 &&
            parent.children[0].insert === '\n'
          ) {
            return render('.between-paragraphs');
          }
          // render normal parent nodes with content
          return render(
            parent.attributes && parent.attributes.blockquote
              ? 'blockquote'
              : parent.attributes && parent.attributes['code-block']
              ? 'pre'
              : parent.attributes && parent.attributes.header === 1
              ? 'h1'
              : parent.attributes && parent.attributes.header === 2
              ? 'h2'
              : parent.attributes && parent.attributes.header === 3
              ? 'h3'
              : parent.attributes && parent.attributes.header === 4
              ? 'h4'
              : parent.attributes && parent.attributes.header === 5
              ? 'h5'
              : parent.attributes && parent.attributes.header === 6
              ? 'h6'
              : parent.attributes && parent.attributes.list === 'bullet'
              ? 'li'
              : parent.attributes && parent.attributes.list === 'ordered'
              ? 'li'
              : parent.attributes && parent.attributes.list === 'checked'
              ? `li.checked`
              : parent.attributes && parent.attributes.list === 'unchecked'
              ? `li.unchecked`
              : 'div',
            parent.children.map(renderChild)
          );
        };
        // special handler for lists, which need to be un-flattened and turned into a tree
        const renderListGroup = (_group) => {
          const temp = []; // accumulator for potential parent tree nodes; will grow to the maximum depth of the tree
          _group.parents.forEach((parent) => {
            const tag = getParentTag(parent);
            const content = parent.children.map(renderChild);
            if (tag === 'li.checked') {
              content.unshift(
                render(`input[type='checkbox'][disabled][checked]`)
              );
            } else if (tag === 'li.unchecked') {
              content.unshift(render(`input[type='checkbox'][disabled]`));
            }
            const indent = parent.attributes.indent || 0;

            if (indent >= temp.length) {
              // indent
              temp.push([]);
              temp[temp.length - 1].push({ tag, content, indent });
            } else if (indent === temp.length - 1) {
              // keep same
              temp[indent].push({ tag, content, indent });
            } else if (indent < temp.length - 1) {
              // outdent and unwind
              while (indent < temp.length - 1) {
                const outdentBuffer = temp[temp.length - 2];
                outdentBuffer[outdentBuffer.length - 1].content.push(
                  render(
                    getGroupTag(_group),
                    temp.pop().map((data) => {
                      return render(data.tag, data.content);
                    })
                  )
                );
              }
              temp[temp.length - 1].push({ tag, content, indent });
            }
          });

          // fully unwind and collect stray children
          while (temp.length > 1) {
            const outdentBuffer = temp[temp.length - 2];
            outdentBuffer[outdentBuffer.length - 1].content.push(
              render(
                getGroupTag(_group),
                temp.pop().map(({ tag, content }) => {
                  return render(tag, content);
                })
              )
            );
          }
          return render(
            getGroupTag(_group),
            temp[0].map(({ tag, content }) => {
              return render(tag, content);
            })
          );
        };

        if (group.length) return group.map(renderListGroup);
        else return group.parents.map(renderParent);
      });
};
