import 'components/topic_selector.scss';

import m from 'mithril';
import { SelectList, ListItem, Callout, Colors, Button, Icons, List } from 'construct-ui';

import app from 'state';
import NewTopicModal from 'views/modals/new_topic_modal';
import { OffchainTopic } from 'models';

const TopicSelector: m.Component<{
  defaultTopic?: OffchainTopic | string | boolean;
  featuredTopics: OffchainTopic[];
  tabindex?: number;
  topics: OffchainTopic[];
  updateFormData: Function;
}, {
  error: string;
  selectedTopic?: OffchainTopic;
}> = {
  oninit: (vnode) => {
    const { defaultTopic, topics } = vnode.attrs;
    if (defaultTopic === false) {
      vnode.state.selectedTopic = undefined;
    } else if (defaultTopic && typeof defaultTopic === 'string') {
      vnode.state.selectedTopic = topics.find((t) => t.name === defaultTopic);
    } else if (defaultTopic && defaultTopic instanceof OffchainTopic) {
      vnode.state.selectedTopic = defaultTopic;
    }
  },
  view: (vnode) => {
    const { defaultTopic, featuredTopics, tabindex, topics, updateFormData } = vnode.attrs;

    const itemRender = (topic) => {
      return m(ListItem, {
        class: featuredTopics.includes(topic) ? 'featured-topic' : 'other-topic',
        label: [
          m('span.proposal-topic-icon'),
          m('span.topic-name', topic.name),
        ],
        selected: (vnode.state.selectedTopic as OffchainTopic)?.name === topic.name,
      });
    };

    const itemPredicate = (query: string, item: OffchainTopic) => {
      return item.name.toLowerCase().includes(query.toLowerCase());
    };

    const oncreate = () => {
      if (vnode.state.selectedTopic) {
        updateFormData(vnode.state.selectedTopic.name, vnode.state.selectedTopic.id);
      }
    };

    const onSelect = (item: OffchainTopic) => {
      vnode.state.selectedTopic = item;
      updateFormData(item.name, item.id);
    };

    const manuallyClosePopover = () => {
      const button = document.getElementsByClassName('topic-selection-drop-menu')[0];
      if (button) (button as HTMLButtonElement).click();
    };

    const addTopic = (topic?) => {
      const newTopic = topic || (document.getElementsByClassName('autocomplete-topic-input')[0]
        .firstChild as HTMLInputElement).value;
      topics.push({ name: newTopic, id: null, description: '' });
      setTimeout(() => { vnode.state.selectedTopic = newTopic; m.redraw(); }, 1);
      updateFormData(newTopic);
      if (!topic) manuallyClosePopover();
    };

    const sortTopics = (topics_: OffchainTopic[]) => {
      return topics_.filter((topic) => featuredTopics.includes(topic)).sort((a, b) => a.name > b.name ? 1 : -1)
        .concat(topics_.filter((topic) => !featuredTopics.includes(topic)).sort((a, b) => a.name > b.name ? 1 : -1));
    };

    return m(SelectList, {
      class: 'TopicSelector',
      filterable: false,
      checkmark: false,
      closeOnSelect: true,
      emptyContent: [
        m(Callout, {
          size: 'sm',
          class: 'no-matching-topics',
          icon: Icons.ALERT_TRIANGLE,
          intent: 'negative',
          content: 'This community has not been configured with topics yet',
        }),
      ],
      itemPredicate,
      itemRender,
      items: sortTopics(topics),
      oncreate,
      onSelect,
      trigger: m(Button, {
        align: 'left',
        class: 'topic-selection-drop-menu',
        compact: true,
        iconRight: Icons.CHEVRON_DOWN,
        label: vnode.state.selectedTopic
          ? [
            m('span.proposal-topic-icon'),
            m('span.topic-name', [
              vnode.state.selectedTopic.name
            ]),
          ]
          : '',
        sublabel: vnode.state.selectedTopic ? '' : 'Select a topic',
        tabindex
      }),
    });
  },
};

export default TopicSelector;
