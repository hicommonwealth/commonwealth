import 'components/topic_selector.scss';

import m from 'mithril';
import { SelectList, ListItem, Callout, Button, Icons } from 'construct-ui';
import { OffchainTopic } from 'models';
import BN from 'bn.js';

const TopicSelector: m.Component<{
  defaultTopic?: OffchainTopic | string | boolean;
  featuredTopics: OffchainTopic[];
  tabindex?: number;
  topics: OffchainTopic[];
  updateFormData: Function;
}, {
  error: string;
}> = {
  view: (vnode) => {
    const { defaultTopic, featuredTopics, tabindex, topics, updateFormData } = vnode.attrs;
    let selectedTopic;
    if (defaultTopic === false) {
      selectedTopic = undefined;
    } else if (defaultTopic && typeof defaultTopic === 'string') {
      selectedTopic = topics.find((t) => t.name === defaultTopic);
    } else if (defaultTopic && defaultTopic instanceof OffchainTopic) {
      selectedTopic = defaultTopic;
    }

    const itemRender = (topic) => {
      return m(ListItem, {
        class: featuredTopics.includes(topic) ? 'featured-topic' : 'other-topic',
        label: [
          m('span.topic-name', topic.name),
        ],
        selected: (selectedTopic as OffchainTopic)?.name === topic.name,
      });
    };

    const itemPredicate = (query: string, item: OffchainTopic) => {
      return item.name.toLowerCase().includes(query.toLowerCase());
    };

    const oncreate = () => {
      if (selectedTopic) {
        updateFormData(selectedTopic.name, selectedTopic.id);
      }
    };

    const onSelect = (item: OffchainTopic) => {
      selectedTopic = item;
      updateFormData(item.name, item.id);
    };

    const manuallyClosePopover = () => {
      const button = document.getElementsByClassName('topic-selection-drop-menu')[0];
      if (button) (button as HTMLButtonElement).click();
    };

    const addTopic = (topic?) => {
      const newTopic = topic || (document.getElementsByClassName('autocomplete-topic-input')[0]
        .firstChild as HTMLInputElement).value;
      topics.push({ name: newTopic, id: null, description: '', telegram: '', token_threshold: new BN(0) });
      setTimeout(() => { selectedTopic = newTopic; m.redraw(); }, 1);
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
        // TODO: This should be unused now that we allow communities without topics
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
      popoverAttrs: {
        transitionDuration: 0,
        hasArrow: false,
      },
      trigger: m(Button, {
        align: 'left',
        class: 'topic-selection-drop-menu',
        compact: true,
        iconRight: Icons.CHEVRON_DOWN,
        label: selectedTopic
          ? [
            m('span.proposal-topic-icon'),
            m('span.topic-name', [
              selectedTopic.name
            ]),
          ]
          : '',
        sublabel: selectedTopic ? '' : 'Select a topic',
        tabindex
      }),
    });
  },
};

export default TopicSelector;
