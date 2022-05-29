/* @jsx m */

import m from 'mithril';
import { Button, Classes, Dialog } from 'construct-ui';

import app from 'state';
import { OffchainThread, Topic } from 'models';
import { TopicSelector } from './topic_selector';

type TopicWindowAttrs = {
  onChangeHandler: () => void;
  thread: OffchainThread;
};

class TopicWindow implements m.ClassComponent<TopicWindowAttrs> {
  private activeTopic: Topic | string;

  oninit(vnode) {
    this.activeTopic = vnode.attrs.thread.topic;
  }

  view(vnode) {
    return (
      <TopicSelector
        defaultTopic={this.activeTopic}
        topics={app.topics.getByCommunity(app.activeChainId())}
        updateFormData={(topicName, topicId?) => {
          vnode.attrs.onChangeHandler(topicName, topicId);
          this.activeTopic = topicName;
        }}
      />
    );
  }
}

type TopicEditorAttrs = {
  onChangeHandler: () => void;
  popoverMenu?: boolean;
  thread: OffchainThread;
  openStateHandler: () => void;
};

export class TopicEditor implements m.ClassComponent<TopicEditorAttrs> {
  isOpen: boolean;
  topicId: number;
  topicName: string;

  oncreate(vnode) {
    if (!vnode.attrs.thread.topic) return;

    this.topicName = vnode.attrs.thread.topic.name;
    this.topicId = vnode.attrs.thread.topic.id;
  }

  oninit(vnode) {
    this.isOpen = !!vnode.attrs.popoverMenu;
  }

  view(vnode) {
    return (
      <div class="TopicEditor">
        {!vnode.attrs.popoverMenu && (
          <a
            href="#"
            onclick={(e) => {
              e.preventDefault();
              this.isOpen = true;
            }}
          >
            Move to another topic
          </a>
        )}
        <Dialog
          basic={false}
          closeOnEscapeKey={true}
          closeOnOutsideClick={true}
          content={
            <TopicWindow
              thread={vnode.attrs.thread}
              onChangeHandler={(topicName, topicId?) => {
                this.topicName = topicName;
                this.topicId = topicId;
              }}
            />
          }
          hasBackdrop={true}
          isOpen={vnode.attrs.popoverMenu ? true : this.isOpen}
          inline={false}
          onClose={() => {
            if (vnode.attrs.popoverMenu) {
              vnode.attrs.openStateHandler(false);
            } else {
              this.isOpen = false;
            }
          }}
          title="Edit topic"
          transitionDuration={200}
          footer={
            <div class={Classes.ALIGN_RIGHT}>
              <Button
                label="Cancel"
                rounded={true}
                onclick={() => {
                  if (vnode.attrs.popoverMenu) {
                    vnode.attrs.openStateHandler(false);
                  } else {
                    this.isOpen = false;
                  }
                }}
              />
              <Button
                label="Save changes"
                intent="primary"
                rounded={true}
                onclick={async () => {
                  const { topicName, topicId } = this;
                  const { thread } = vnode.attrs;
                  try {
                    const topic: Topic = await app.topics.update(
                      thread.id,
                      topicName,
                      topicId
                    );
                    vnode.attrs.onChangeHandler(topic);
                  } catch (err) {
                    console.log('Failed to update topic');
                    throw new Error(
                      err.responseJSON && err.responseJSON.error
                        ? err.responseJSON.error
                        : 'Failed to update topic'
                    );
                  }
                  if (vnode.attrs.popoverMenu) {
                    vnode.attrs.openStateHandler(false);
                  } else {
                    this.isOpen = false;
                  }
                }}
              />
            </div>
          }
        />
      </div>
    );
  }
}
