import 'components/topic_selector.scss';
import dragula from 'dragula';

import m, { VnodeDOM } from 'mithril';
import { ListItem, Button, List, Icon, Icons } from 'construct-ui';
import app from 'state';

const OrderTopicModal: m.Component<
  null,
  { featuredTopics; featuredTopicOrder }
> = {
  oninit: (vnode: VnodeDOM<null, { featuredTopics; featuredTopicOrder }>) => {
    vnode.state.featuredTopics = app.chain.meta.chain.topics.filter(
      (topic) => topic.featuredInSidebar
    );
    console.log(vnode.state.featuredTopics);
    if (!vnode.state.featuredTopics[0].order) {
      vnode.state.featuredTopics
        .sort((a, b) => b.name - a.name)
        .forEach((topic, idx) => {
          topic.order = idx + 1;
        });
    }
    vnode.state.featuredTopics.sort((a, b) => b.order - a.order || b - a);

    vnode.state.featuredTopicOrder = {};
    vnode.state.featuredTopics.forEach((topic) => {
      vnode.state.featuredTopicOrder[topic.order] = topic;
    });
    console.log(vnode.state.featuredTopicOrder);
  },
  oncreate: (vnode: VnodeDOM<null, { featuredTopics; featuredTopicOrder }>) => {
    dragula([document.querySelector('.featured-topic-list')]).on(
      'drop',
      async (el, target, source, sibling) => {
        console.log({
          el,
          target,
          source,
          sibling,
        });
        const movedTopic = vnode.state.featuredTopics.find(
          (t) => t.name === el.innerText
        );
        const siblingTopic = vnode.state.featuredTopics.find(
          (t) => t.name === sibling.innerText
        );
      }
    );
  },
  view: (vnode: VnodeDOM<null, { featuredTopics; featuredTopicOrder }>) => {
    const { featuredTopics } = vnode.state;

    return m('.OrderTopicModal', [
      m('.header', 'Reorder Topics'),
      m('.compact-modal-body', [
        m(
          List,
          {
            class: 'featured-topic-list',
          },
          featuredTopics.map((t) =>
            m(ListItem, {
              label: [m('span.topic-name', t.name)],
              contentRight: m(Icon, { name: Icons.ALIGN_JUSTIFY }),
            })
          )
        ),
        m(Button, {
          intent: 'primary',
          type: 'submit',
          rounded: true,
          onclick: async (e) => {
            e.preventDefault();
            $(e.target).trigger('modalexit');
          },
          label: 'Save',
        }),
      ]),
    ]);
  },
};

export default OrderTopicModal;
