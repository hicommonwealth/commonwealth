/* @jsx m */

import m from 'mithril';
import { SelectList, ListItem, Callout, Button, Icons } from 'construct-ui';

import 'components/topic_selector.scss';

import { OffchainTopic } from 'models';
import { isNotUndefined } from 'helpers/typeGuards';

type TopicSelectorAttrs = {
  defaultTopic?: OffchainTopic | string | boolean;
  tabindex?: number;
  topics: OffchainTopic[];
  updateFormData: () => void;
};

export class TopicSelector implements m.ClassComponent<TopicSelectorAttrs> {
  view(vnode) {
    const { defaultTopic, tabindex, topics, updateFormData } = vnode.attrs;

    let selectedTopic;

    if (defaultTopic === false) {
      selectedTopic = undefined;
    } else if (defaultTopic && typeof defaultTopic === 'string') {
      selectedTopic = topics.find((t) => t.name === defaultTopic);
    } else if (defaultTopic && defaultTopic instanceof OffchainTopic) {
      selectedTopic = defaultTopic;
    }

    const featuredTopics = topics
      .filter((topic) => topic.featuredInSidebar)
      .sort((a, b) => b.order - a.order);

    const itemRender = (topic) => {
      return (
        <ListItem
          label={topic.name}
          selected={(selectedTopic as OffchainTopic)?.name === topic.name}
        />
      );
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

    return (
      <SelectList
        class="TopicSelector"
        filterable={false}
        checkmark={false}
        closeOnSelect={true}
        emptyContent={
          // TODO: This should be unused now that we allow communities without topics
          <Callout
            size="sm"
            class="no-matching-topics"
            icon={Icons.ALERT_TRIANGLE}
            intent="negative"
            content="This community has not been configured with topics yet"
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
          <Button
            align="left"
            class="topic-selection-drop-menu"
            compact={true}
            iconRight={Icons.CHEVRON_DOWN}
            label={isNotUndefined(selectedTopic) ? selectedTopic.name : ''}
            sublabel={isNotUndefined(selectedTopic) ? '' : 'Select a topic'}
            tabindex={tabindex}
          />
        }
      />
    );
  }
}
