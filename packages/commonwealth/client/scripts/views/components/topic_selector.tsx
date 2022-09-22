/* @jsx m */

import m from 'mithril';
import { SelectList, ListItem, Callout, Icons } from 'construct-ui';

import 'components/topic_selector.scss';

import { Topic } from 'models';
import { isNotUndefined } from 'helpers/typeGuards';
import { CWButton } from './component_kit/cw_button';

type TopicSelectorAttrs = {
  defaultTopic?: Topic | string | boolean;
  tabindex?: number;
  topics: Topic[];
  updateFormData: (topic: Topic) => void;
};

export class TopicSelector implements m.ClassComponent<TopicSelectorAttrs> {
  view(vnode) {
    const { defaultTopic, tabindex, topics, updateFormData } = vnode.attrs;

    let selectedTopic;

    if (defaultTopic === false) {
      selectedTopic = undefined;
    } else if (defaultTopic && typeof defaultTopic === 'string') {
      selectedTopic = topics.find((t) => t.name === defaultTopic);
    } else if (defaultTopic && defaultTopic instanceof Topic) {
      selectedTopic = defaultTopic;
    }

    const featuredTopics = topics
      .filter((topic) => topic.featuredInSidebar)
      .sort((a, b) => b.order - a.order);

    const itemRender = (topic) => {
      return (
        <ListItem
          label={topic.name}
          selected={(selectedTopic as Topic)?.name === topic.name}
        />
      );
    };

    const itemPredicate = (query: string, item: Topic) => {
      return item.name.toLowerCase().includes(query.toLowerCase());
    };

    const oncreate = () => {
      if (selectedTopic) {
        updateFormData(selectedTopic);
      }
    };

    const onSelect = (item: Topic) => {
      selectedTopic = item;
      updateFormData(selectedTopic);
    };

    const sortTopics = (topics_: Topic[]) => {
      return topics_
        .filter((topic) => featuredTopics.includes(topic))
        .sort((a, b) => (a.name > b.name ? 1 : -1))
        .concat(
          topics_
            .filter((topic) => !featuredTopics.includes(topic))
            .sort((a, b) => (a.name > b.name ? 1 : -1))
        );
    };

    return (
      <SelectList
        class="TopicSelector"
        filterable={false}
        checkmark={false}
        closeOnSelect
        emptyContent={
          // This appears if no topics are available because all require token thresholds
          <Callout
            size="sm"
            class="no-matching-topics"
            icon={Icons.ALERT_TRIANGLE}
            intent="negative"
            content="Insufficient token balance."
          />
        }
        itemPredicate={itemPredicate}
        itemRender={itemRender}
        items={sortTopics(topics)}
        oncreate={oncreate}
        onSelect={onSelect}
        popoverAttrs={{
          transitionDuration: 0,
          hasArrow: false,
        }}
        trigger={
          <CWButton
            buttonType="lg-secondary-blue"
            iconLeft="chevronDown"
            label={
              isNotUndefined(selectedTopic)
                ? selectedTopic.name
                : 'Select a topic'
            }
            tabindex={tabindex}
          />
        }
      />
    );
  }
}
