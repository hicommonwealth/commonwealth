/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/topic_selector.scss';
import { isNotUndefined } from 'helpers/typeGuards';

import { Topic } from 'models';
import { CWButton } from './component_kit/cw_button';

type TopicSelectorAttrs = {
  defaultTopic?: Topic | string | boolean;
  tabIndex?: number;
  topics: Topic[];
  updateFormData: (topic: Topic) => void;
};

export class TopicSelector extends ClassComponent<TopicSelectorAttrs> {
  view(vnode: ResultNode<TopicSelectorAttrs>) {
    const { defaultTopic, tabIndex, topics, updateFormData } = vnode.attrs;

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
      return render('.removeme', `${topic.name}`); // @TODO @REACT REMOVE ME
      // return m(ListItem, {
      //   label: topic.name,
      //   selected: (selectedTopic as Topic)?.name === topic.name,
      // });
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

    return null; // @TODO @REACT remove me please
    // return m(SelectList, {
    //   class: 'TopicSelector',
    //   filterable: false,
    //   checkmark: false,
    //   closeOnSelect: true,
    //   emptyContent:
    //     // This appears if no topics are available because all require token thresholds
    //     m(Callout, {
    //       size: 'sm',
    //       class: 'no-matching-topics',
    //       icon: Icons.ALERT_TRIANGLE,
    //       intent: 'negative',
    //       content: 'Insufficient token balance.',
    //     }),
    //   itemPredicate,
    //   itemRender,
    //   items: sortTopics(topics),
    //   oncreate,
    //   onSelect,
    //   popoverAttrs: {
    //     transitionDuration: 0,
    //     hasArrow: false,
    //   },
    //   trigger: (
    //     <CWButton
    //       buttonType="lg-secondary-blue"
    //       iconName="chevronDown"
    //       label={
    //         isNotUndefined(selectedTopic)
    //           ? selectedTopic.name
    //           : 'Select a topic'
    //       }
    //       tabIndex={tabIndex}
    //     />
    //   ),
    // });
  }
}
