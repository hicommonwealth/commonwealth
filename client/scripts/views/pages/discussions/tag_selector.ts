/* eslint-disable no-unused-expressions */
import 'pages/discussions.scss';

import _ from 'lodash';
import m from 'mithril';

import app from 'state';
import { link } from 'helpers';
import { OffchainThreadKind } from 'models/models';

interface ITagSelectorAttrs {
  activeTag?: string;
}

const TagSelector: m.Component<ITagSelectorAttrs> = {
  view: (vnode) => {
    const { activeTag } = vnode.attrs;
    const activeEntity = app.community ? app.community : app.chain;
    const topTags = {};
    app.threads.getType(OffchainThreadKind.Forum, OffchainThreadKind.Link)
      .forEach((thread) => {
        const { tags } = thread;
        tags.forEach((tag) => {
          const { name } = tag;
          if (topTags[name]) { topTags[name].count += 1; }
          else {
            const selected = name === activeTag;
            const count = 1;
            topTags[name] = { selected, count };
          }
        });
      });
    if (!activeEntity) return;
    return m('.TagSelector', [
      Object.keys(topTags)
        .sort((a, b) => topTags[b].count - topTags[a].count)
        .map((name) => {
          const { selected, count } = topTags[name];
          if (!count) return;
          return m('.tag-selector-item', {
            class: selected ? 'selected' : '',
          }, [
            link('a.tag-name',
              (selected ? `/${app.activeId()}/` : `/${app.activeId()}/discussions/${name}`),
              `#${name} (${count})`),
          ]);
        })
    ]);
  },
};

export default TagSelector;
