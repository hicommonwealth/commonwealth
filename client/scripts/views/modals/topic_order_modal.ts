import 'components/topic_selector.scss';
import dragula from 'dragula';

import m, { VnodeDOM } from 'mithril';
import { ListItem, Button, List, Icon, Icons } from 'construct-ui';
import app from 'state';

const TopicOrderModal: m.Component<null, { featuredTopics }> = {
  oncreate: (vnode: VnodeDOM<{}, { featuredTopics }>) => {
    dragula([document.querySelector('.featured-topic-list')])
      .on('drop', async (el, target, source, sibling) => {
        console.log({
          el,
          target,
          source,
          sibling
        });
        const siblingTopic = vnode.state.featuredTopics
          .find((t) => t.name === sibling.innerText);
      });
  },
  view: (vnode: VnodeDOM<null, { featuredTopics }>) => {
    vnode.state.featuredTopics = app.chain.meta.chain.topics.filter((topic) => topic.featuredInSidebar);
    const { featuredTopics } = vnode.state;

    return m('.TopicOrderModal', [
      m('.header', 'Reorder Topics'),
      m('.compact-modal-body', [
        m(List, {
          class: 'featured-topic-list',
        },
          featuredTopics
            .sort((a, b) => (a.name > b.name ? 1 : -1))
            .map((t) => m(ListItem, {
              label: [m('span.topic-name', t.name)],
              contentRight: m(Icon, { name: Icons.ALIGN_JUSTIFY }),
            }))
        ),
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
