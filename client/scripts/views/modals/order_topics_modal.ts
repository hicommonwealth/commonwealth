import 'modals/order_topics_modal.scss';
import dragula from 'dragula';
import $ from 'jquery';
import m, { VnodeDOM } from 'mithril';
import { ListItem, Button, List, Icon, Icons } from 'construct-ui';
import app from 'state';
import { OffchainTopic } from 'models';
import { notifyError } from 'controllers/app/notifications';
import { confirmationModalWithText } from './confirm_modal';

const getTopicFromElement = (
  htmlEle: HTMLElement,
  allTopics: OffchainTopic[]
): OffchainTopic => {
  const topic = allTopics.find((t) => t.name === htmlEle.innerText);
  return topic;
};

const storeNewTopicOrder = (
  HTMLContainer: HTMLElement,
  state: { topics: OffchainTopic[] }
) => {
  state.topics = Array.from(HTMLContainer.childNodes).map((node: HTMLElement) =>
    getTopicFromElement(node, state.topics)
  );
  state.topics.forEach((t, idx) => {
    t.order = idx + 1;
  });
};

const OrderTopicsModal: m.Component<null, { topics: OffchainTopic[] }> = {
  oninit: (vnode: VnodeDOM<null, { topics: OffchainTopic[] }>) => {
    vnode.state.topics = app.chain.meta.chain.topics.filter(
      (topic) => topic.featuredInSidebar
    );

    // If featured topics have not been re-ordered previously, they may lack
    // an order prop. We auto-generate a temporary order for these topics so
    // they may be properly shuffled.
    if (!vnode.state.topics[0].order) {
      vnode.state.topics
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((topic, idx) => {
          topic.order = idx + 1;
        });
    } else {
      vnode.state.topics.sort((a, b) => a.order - b.order);
    }
  },
  oncreate: (vnode: VnodeDOM<null, { topics: OffchainTopic[] }>) => {
    dragula([document.querySelector('.featured-topic-list')]).on(
      'drop',
      async (draggedEle, targetDiv, sourceDiv) => {
        storeNewTopicOrder(sourceDiv, vnode.state);
      }
    );
  },
  view: (vnode: VnodeDOM<null, { topics: OffchainTopic[] }>) => {
    const { topics } = vnode.state;

    return m('.OrderTopicsModal', [
      m('h3.compact-modal-title', 'Reorder Topics'),
      m('.compact-modal-body', [
        m(
          List,
          {
            class: 'featured-topic-list',
          },
          topics.map((t) =>
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
            try {
              app.topics.updateFeaturedOrder(topics);
              $(e.target).trigger('modalexit');
            } catch (err) {
              notifyError('Failed to update order');
            }
          },
          label: 'Save',
        }),
      ]),
    ]);
  },
};

// inject confirmExit property
OrderTopicsModal['confirmExit'] = confirmationModalWithText(
  'Exit now?',
  'Yes',
  'No'
);

export default OrderTopicsModal;
