import React, { ReactElement } from 'react';

import { loadScript } from 'helpers';
import { DeltaStatic } from 'quill';
import { preprocessQuillDeltaForRendering } from '../../../../../shared/utils';
import { containsASCIIPatterns, getTextFromDelta } from './utils';

type TempList = Array<
  Array<{
    key: number;
    indent: number;
    tag: keyof JSX.IntrinsicElements;
    tagClass: string | undefined;
    content: Array<ReactElement>;
  }>
>;

const getGroupTag = (
  group: { listtype: string },
  collapse: boolean,
): ['span' | 'ul' | 'ol' | 'div', string?] => {
  if (collapse) return ['span'];
  if (group.listtype === 'bullet') return ['ul'];
  if (group.listtype === 'ordered') return ['ol'];
  if (group.listtype === 'checked' || group.listtype === 'unchecked')
    return ['ul', 'checklist'];
  return ['div'];
};

const getParentTag = (
  parent: {
    attributes: { list?: string };
  },
  collapse: boolean,
): ['span' | 'li' | 'div', ('checked' | 'unchecked')?] => {
  if (collapse) return ['span'];
  if (parent.attributes?.list === 'bullet') return ['li'];
  if (parent.attributes?.list === 'ordered') return ['li'];
  if (parent.attributes?.list === 'checked') return ['li', 'checked'];
  if (parent.attributes?.list === 'unchecked') return ['li', 'unchecked'];
  return ['div'];
};

// multiple list groups should be consolidated, so numbering is preserved even when ordered lists are broken
const consolidateOrderedLists = (_groups) => {
  if (_groups[0].parents[0].attributes?.list === 'code-block') return;
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

export const renderQuillDelta = (
  delta: DeltaStatic,
  hideFormatting = false,
  collapse = false,
  openLinksInNewTab = false,
  navigate,
) => {
  const convertedDelta = getTextFromDelta(delta);
  const isAscii = containsASCIIPatterns(convertedDelta);

  // convert quill delta into a tree of {block -> parent -> child} nodes
  // blocks are <ul> <ol>, parents are all other block nodes, children are inline nodes

  // trim beginning content...
  if (typeof delta.ops[0]?.insert === 'string' && !isAscii) {
    delta.ops[0].insert = delta.ops[0].insert.trimLeft();
  }

  // first, concatenate parent nodes for <ul> and <ol> into groups
  const groups = [];
  preprocessQuillDeltaForRendering(delta.ops).forEach((parent) => {
    // if the last parent was a <ul> or <ol> with the same attributes.list,
    // concatenate the current parent's children onto the last instead
    //
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

  return hideFormatting || collapse
    ? groups.map((group, i) => {
        const wrapGroupForHiddenFormatting = (content) => {
          const [GroupTag, groupTagClass] = getGroupTag(group, collapse);
          const className = `hidden-formatting ${groupTagClass || ''}`;

          return (
            <GroupTag key={i} className={className}>
              {content}
            </GroupTag>
          );
        };

        return wrapGroupForHiddenFormatting(
          group.parents.map((parent, ii) => {
            const [ParentTag, parentTagClass] = getParentTag(parent, collapse);
            const className = `hidden-formatting-inner ${parentTagClass || ''}`;

            return (
              <ParentTag className={className} key={ii}>
                {parent.children.map((child, iii) => {
                  if (child.insert?.mention)
                    return (
                      <span className="mention" key={iii}>
                        {child.insert.mention.denotationChar +
                          child.insert.mention.value}
                      </span>
                    );

                  if (child.insert?.image) return;
                  if (child.insert?.twitter) return;
                  if (child.insert?.video) return;
                  if (child.attributes?.link) {
                    return (
                      <a
                        key={iii}
                        href={child.attributes.link}
                        target={openLinksInNewTab ? '_blank' : ''}
                        rel="noopener noreferrer"
                        onClick={async (e) => {
                          if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey)
                            return;
                          if (
                            child.attributes.link.startsWith(
                              `${document.location.origin}/`,
                            )
                          ) {
                            // don't open a new window if the link is on Commonwealth
                            e.preventDefault();
                            e.stopPropagation();
                            const navigateTo = child.attributes.link.split(
                              `${document.location.origin}`,
                            )[1];
                            navigate(navigateTo, {}, null);
                          }
                        }}
                      >
                        {child.insert}
                      </a>
                    );
                  }
                  if (child.insert.match(/[A-Za-z0-9]$/)) {
                    // add a period and space after lines that end on a word or
                    // number, like Google does in search previews
                    return <span key={iii}>{`${child.insert}. `}</span>;
                  } else {
                    return <span key={iii}>{`${child.insert}`}</span>;
                  }
                })}
              </ParentTag>
            );
          }),
        );
      })
    : consolidateOrderedLists(groups).map((group) => {
        const isCodeEnabled = group.parents[0].attributes?.['code-block'];
        const renderChild = (child, ii) => {
          // handle images
          if (child.insert?.image) {
            return <img key={ii} src={child.insert?.image} alt="image" />;
          }

          // handle video
          if (child.insert?.video) {
            return (
              <div key={ii}>
                <iframe
                  frameBorder={0}
                  allowFullScreen={true}
                  src={child.insert?.video}
                  key={1}
                />
                <br key={2} />
              </div>
            );
          }

          // handle tweets
          if (child.insert?.twitter) {
            const id = child.insert.twitter.id;
            if (!(window as any).twttr) {
              loadScript('//platform.twitter.com/widgets.js').then(() => {
                setTimeout(() => {
                  // eslint-disable-next-line
                  (window as any).twttr?.widgets?.load();
                }, 1);
              });
            } else {
              setTimeout(() => {
                // eslint-disable-next-line
                (window as any).twttr?.widgets?.load();
              }, 1);
            }
            const url = `https://twitter.com/user/status/${id}`;
            return (
              <blockquote key={ii} className="twitter-tweet">
                <a tabIndex={-1} href={url} />
              </blockquote>
            );
          }

          // handle text nodes
          let result;
          if (child.insert?.mention) {
            result = (
              <span className="mention" key={ii}>
                {child.insert.mention.denotationChar +
                  child.insert.mention.value}
              </span>
            );
          } else if (child.attributes?.link) {
            result = (
              <a
                key={ii}
                href={child.attributes.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) return;
                  if (
                    child.attributes.link.startsWith(
                      `${document.location.origin}/`,
                    )
                  ) {
                    // don't open a new window if the link is on Commonwealth
                    e.preventDefault();
                    e.stopPropagation();
                    const navigateTo = child.attributes.link.split(
                      `${document.location.origin}`,
                    )[1];
                    navigate(navigateTo, {}, null);
                  }
                }}
              >
                {child.insert}
              </a>
            );
          } else if (child.attributes?.code) {
            result = <span key={ii}>{child.insert}</span>;
          } else if (isCodeEnabled && isAscii) {
            result = (
              <code key={ii}>
                {child.insert.match(/^\n+$/) ? null : child.insert}
              </code>
            );
          } else {
            result = <span key={ii}>{child.insert}</span>;
          }

          Object.entries(child.attributes || {}).forEach(([k, v]) => {
            if (k !== 'color' && k !== 'background' && v !== true) return;

            switch (k) {
              case 'bold':
                result = <b key={ii}>{result}</b>;
                return;
              case 'italic':
                result = <i key={ii}>{result}</i>;
                return;
              case 'strike':
                result = <s key={ii}>{result}</s>;
                return;
              case 'underline':
                result = <u key={ii}>{result}</u>;
                return;
              case 'code':
                result = <code key={ii}>{result}</code>;
                return;
              case 'added':
                result = (
                  <span key={ii} className="added">
                    {result}
                  </span>
                );
                return;
              case 'deleted':
                result = (
                  <span key={ii} className="deleted">
                    {result}
                  </span>
                );
                return;
              default:
                result = <span key={ii}>{result}</span>;
            }
          });

          return result;
        };

        const renderParent = (parent, ii) => {
          // render empty parent nodes as .between-paragraphs
          if (
            !parent.attributes &&
            parent.children.length === 1 &&
            parent.children[0].insert === '\n'
          ) {
            return <div className="between-paragraphs" key={ii} />;
          }

          // render normal parent nodes with content
          const Tag = parent.attributes?.blockquote
            ? 'blockquote'
            : parent.attributes?.['code-block']
            ? 'pre'
            : parent.attributes?.header === 1
            ? 'h1'
            : parent.attributes?.header === 2
            ? 'h2'
            : parent.attributes?.header === 3
            ? 'h3'
            : parent.attributes?.header === 4
            ? 'h4'
            : parent.attributes?.header === 5
            ? 'h5'
            : parent.attributes?.header === 6
            ? 'h6'
            : parent.attributes?.list === 'bullet'
            ? 'li'
            : parent.attributes?.list === 'ordered'
            ? 'li'
            : parent.attributes?.list === 'checked'
            ? 'li'
            : parent.attributes?.list === 'unchecked'
            ? 'li'
            : 'div';

          const className =
            parent.attributes?.list === 'checked'
              ? 'checked'
              : parent.attributes?.list === 'unchecked'
              ? 'unchecked'
              : '';

          return (
            <Tag key={ii} className={className}>
              {parent.children.map(renderChild)}
            </Tag>
          );
        };

        // special handler for lists, which need to be un-flattened and turned into a tree
        const renderListGroup = (_group, ii) => {
          const [GroupTag, groupTagClass] = getGroupTag(_group, collapse);

          // accumulator for potential parent tree nodes; will grow to the maximum depth of the tree
          const temp: TempList = [];
          _group.parents.forEach((parent, iii) => {
            const [tag, tagClass] = getParentTag(parent, collapse);
            const isChecked = tagClass === 'checked';
            const content = parent.children.map(renderChild);

            if (tag === 'li' && tagClass) {
              content.unshift(
                <input
                  key={`input-${iii}`}
                  type="checkbox"
                  disabled
                  checked={isChecked}
                />,
              );
            }

            const indent = parent.attributes.indent || 0;

            if (indent >= temp.length) {
              // indent
              temp.push([]);
              temp[temp.length - 1].push({
                tag,
                tagClass,
                content,
                indent,
                key: ii,
              });
            } else if (indent === temp.length - 1) {
              // keep same
              temp[indent].push({ tag, tagClass, content, indent, key: ii });
            } else if (indent < temp.length - 1) {
              // outdent and unwind
              while (indent < temp.length - 1) {
                let iiii = 0;
                const outdentBuffer = temp[temp.length - 2];
                outdentBuffer[outdentBuffer.length - 1].content.push(
                  <GroupTag key={`outdent-${iiii}`} className={groupTagClass}>
                    {temp.pop().map((data, index) => {
                      return (
                        <data.tag key={index} className={data.tagClass}>
                          {data.content}
                        </data.tag>
                      );
                    })}
                  </GroupTag>,
                );
                iiii++;
              }
              temp[temp.length - 1].push({
                tag,
                tagClass,
                content,
                indent,
                key: ii,
              });
            }
          });

          // fully unwind and collect stray children
          while (temp.length > 1) {
            let iii = 0;
            const outdentBuffer = temp[temp.length - 2];
            outdentBuffer[outdentBuffer.length - 1].content.push(
              <GroupTag key={`extra-${iii}`} className={groupTagClass}>
                {temp.pop().map((data, index) => {
                  return (
                    <data.tag key={index} className={data.tagClass}>
                      {data.content}
                    </data.tag>
                  );
                })}
              </GroupTag>,
            );
            iii++;
          }

          return (
            <GroupTag key={ii} className={groupTagClass}>
              {temp[0].map((data, index) => {
                return (
                  <data.tag key={index} className={data.tagClass}>
                    {data.content}
                  </data.tag>
                );
              })}
            </GroupTag>
          );
        };

        if (group.length) return group.map(renderListGroup);
        else return group.parents.map(renderParent);
      });
};
