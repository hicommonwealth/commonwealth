import 'components/topic_selector.scss';

import m from 'mithril';
import { ListItem, Button, List } from 'construct-ui';
import { OffchainTopic } from 'models';
import app from 'client/scripts/state';

const TopicOrderModal: m.Component<{ chain }, {}> = {
  view: (vnode: m.VnodeDOM<{ chain }, {}>) => {
    const featuredTopics = app.chain.meta.chain.topics.filter((topic) => topic.featuredInSidebar);
    const itemRender = (topic) => {
      return m(ListItem, {
        class: featuredTopics.includes(topic)
          ? 'featured-topic'
          : 'other-topic',
        label: [m('span.topic-name', topic.name)],
      });
    };

    const itemPredicate = (query: string, item: OffchainTopic) => {
      return item.name.toLowerCase().includes(query.toLowerCase());
    };

    const sortTopics = (topics_: OffchainTopic[]) => {
      return topics_
        .filter((topic) => featuredTopics.includes(topic))
        .sort((a, b) => (a.name > b.name ? 1 : -1))
        .concat(
          topics_
            .filter((topic) => !featuredTopics.includes(topic))
            .sort((a, b) => (a.name > b.name ? 1 : -1))
        );
    };

    return m('.TopicOrderModal', [
      m('.header', 'Reorder Topic'),
      m('.compact-modal-body', [
        m(List, {
          class: 'TopicSelector',
          filterable: false,
          itemPredicate,
          itemRender,
          items: sortTopics(featuredTopics),
        }),
        m(Button, {
          intent: 'primary',
          type: 'submit',
          rounded: true,
          onclick: async (e) => {
            e.preventDefault();
            $(vnode.dom).trigger('modalforceexit');
            m.redraw();
          },
          label: 'Close'
        }),
      ]),
    ]);
  }
};

export default TopicOrderModal;
