/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'modals/change_topic_modal.scss';

import app from 'state';
import { Thread, Topic } from 'models';
import { CWButton } from '../components/component_kit/cw_button';
import { TopicSelector } from '../components/topic_selector';
import { ModalExitButton } from '../components/component_kit/cw_modal';

type ChangeTopicModalAttrs = {
  onChangeHandler: (topic: Topic) => void;
  thread: Thread;
};

export class ChangeTopicModal
  implements m.ClassComponent<ChangeTopicModalAttrs>
{
  private activeTopic: Topic;

  oninit(vnode) {
    if (!vnode.attrs.thread.topic) return;
    this.activeTopic = vnode.attrs.thread.topic;
  }

  view(vnode) {
    const { thread } = vnode.attrs;

    return (
      <div class="ChangeTopicModal">
        <div class="compact-modal-title">
          <h3>Change topic</h3>
          <ModalExitButton />
        </div>
        <div class="compact-modal-body">
          <TopicSelector
            defaultTopic={this.activeTopic}
            topics={app.topics.getByCommunity(app.activeChainId())}
            updateFormData={(topic: Topic) => {
              vnode.attrs.onChangeHandler(topic);
              this.activeTopic = topic;
            }}
          />
          <div class="buttons-row">
            <CWButton
              buttonType="secondary-blue"
              label="Cancel"
              onclick={(e) => {
                $(e.target).trigger('modalexit');
              }}
            />
            <CWButton
              label="Save changes"
              onclick={async (e) => {
                const { activeTopic } = this;
                try {
                  const topic: Topic = await app.topics.update(
                    thread.id,
                    activeTopic.name,
                    activeTopic.id
                  );

                  vnode.attrs.onChangeHandler(topic);
                  $(e.target).trigger('modalexit');
                } catch (err) {
                  console.log('Failed to update topic');

                  throw new Error(
                    err.responseJSON && err.responseJSON.error
                      ? err.responseJSON.error
                      : 'Failed to update topic'
                  );
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}
