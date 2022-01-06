/* eslint-disable @typescript-eslint/ban-types */
import m from 'mithril';
import $ from 'jquery';
import { Button, Classes, Dialog, Icon, Icons, MenuItem } from 'construct-ui';

import app from 'state';
import { OffchainThread, OffchainTopic } from 'models';
import TopicSelector from './topic_selector';

const TopicWindow: m.Component<{
  thread: OffchainThread,
  onChangeHandler: Function
}, {
  activeTopic: OffchainTopic | string
}> = {
  oninit: (vnode) => {
    if (!vnode.state.activeTopic) {
      vnode.state.activeTopic = vnode.attrs.thread.topic;
    }
  },
  view: (vnode) => {
    const activeMeta =  app.chain.meta.chain;
    const featuredTopics = activeMeta.featuredTopics.map((t) => {
      return app.topics.getByCommunity(app.activeChainId()).find((t_) => Number(t) === t_.id);
    });
    return m(TopicSelector, {
      featuredTopics,
      defaultTopic: vnode.state.activeTopic,
      topics: app.topics.getByCommunity(app.activeChainId()),
      updateFormData: (topicName, topicId?) => {
        vnode.attrs.onChangeHandler(topicName, topicId);
        vnode.state.activeTopic = topicName;
      },
    });
  }
};

const TopicEditor: m.Component<{
  thread: OffchainThread;
  popoverMenu?: boolean;
  onChangeHandler: Function;
  openStateHandler: Function;
}, {
  topicName: string;
  topicId: number;
  isOpen: boolean;
}> = {
  oncreate: (vnode) => {
    if (!vnode.attrs.thread.topic) return;
    vnode.state.topicName = vnode.attrs.thread.topic.name;
    vnode.state.topicId = vnode.attrs.thread.topic.id;
  },
  oninit: (vnode) => {
    vnode.state.isOpen = !!vnode.attrs.popoverMenu;
  },
  view: (vnode) => {
    return m('.TopicEditor', [
      !vnode.attrs.popoverMenu && m('a', {
        href: '#',
        onclick: (e) => { e.preventDefault(); vnode.state.isOpen = true; },
      }, 'Move to another topic'),
      m(Dialog, {
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        content: m(TopicWindow, {
          thread: vnode.attrs.thread,
          onChangeHandler: (topicName, topicId?) => {
            vnode.state.topicName = topicName;
            vnode.state.topicId = topicId;
          }
        }),
        hasBackdrop: true,
        isOpen: vnode.attrs.popoverMenu ? true : vnode.state.isOpen,
        inline: false,
        onClose: () => {
          if (vnode.attrs.popoverMenu) {
            vnode.attrs.openStateHandler(false);
          } else {
            vnode.state.isOpen = false;
          }
        },
        title: 'Edit topic',
        transitionDuration: 200,
        footer: m(`.${Classes.ALIGN_RIGHT}`, [
          m(Button, {
            label: 'Cancel',
            rounded: true,
            onclick: () => {
              if (vnode.attrs.popoverMenu) {
                vnode.attrs.openStateHandler(false);
              } else {
                vnode.state.isOpen = false;
              }
            },
          }),
          m(Button, {
            label: 'Save changes',
            intent: 'primary',
            rounded: true,
            onclick: async () => {
              const { topicName, topicId } = vnode.state;
              const { thread } = vnode.attrs;
              try {
                const topic: OffchainTopic = await app.topics.update(thread.id, topicName, topicId);
                vnode.attrs.onChangeHandler(topic);
              } catch (err) {
                console.log('Failed to update topic');
                throw new Error((err.responseJSON && err.responseJSON.error)
                  ? err.responseJSON.error
                  : 'Failed to update topic');
              }
              if (vnode.attrs.popoverMenu) {
                vnode.attrs.openStateHandler(false);
              } else {
                vnode.state.isOpen = false;
              }
            },
          }),
        ])
      })
    ]);
  }
};

export default TopicEditor;
