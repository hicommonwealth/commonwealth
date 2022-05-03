/* @jsx m */

import m from 'mithril';
import moment from 'moment';
import _ from 'underscore';
import {
  Switch,
  Button,
  Input,
  Classes,
  Dialog,
  SelectList,
  Icons,
} from 'construct-ui';

import 'components/poll_editor.scss';

import { getNextOffchainPollEndingTime } from 'utils';
import app from 'state';
import { OffchainThread } from 'models';
import { pluralize } from 'helpers';
import { notifyError, notifySuccess } from 'controllers/app/notifications';

type PollEditorAttrs = {
  onChangeHandler: () => void;
  thread: OffchainThread;
};

const getPollDurationCopy = (
  customDuration: string,
  customDurationEnabled: boolean
) => {
  if (customDurationEnabled && customDuration === 'Infinite') {
    return 'This poll will never expire.';
  } else if (customDurationEnabled && customDuration !== 'Infinite') {
    return `If started now, this poll will stay open until ${moment()
      .add(customDuration.split(' ')[0], 'days')
      .local()
      .format('lll')}.`;
  } else {
    return `By default, offchain polls run for at least 5 days, ending on the 1st
        and 15th of each month. If started now, this poll would stay open until
        ${getNextOffchainPollEndingTime(moment())
          .local()
          .format('lll')}. Override?`;
  }
};

export class PollEditor implements m.ClassComponent<PollEditorAttrs> {
  private options: string[];
  private customDuration: string;
  private customDurationEnabled: boolean;
  private prompt: string;
  private pollingEnabled: boolean;

  view(vnode) {
    const { onChangeHandler, thread } = vnode.attrs;
    const { pollingEnabled, customDurationEnabled, customDuration } = this;

    // reset options when initializing
    if (!this.options || this.options.length === 0) {
      this.options = ['', ''];
    }

    return (
      <Dialog
        basic={false}
        closeOnEscapeKey={true}
        closeOnOutsideClick={true}
        class="PollEditorDialog"
        content={[
          <Switch
            intent="positive"
            label="Enable polling"
            onchange={(e) => {
              this.pollingEnabled = (e.target as HTMLInputElement).checked;
            }}
          />,
          <h4 class={this.pollingEnabled ? '' : 'disabled'}>Question</h4>,
          <Input
            class="poll-editor-options-question"
            name="Question"
            fluid={true}
            autocomplete="off"
            disabled={!pollingEnabled}
            placeholder="Do you support this proposal?"
            onchange={(e) => {
              this.prompt = (e.target as HTMLInputElement).value;
            }}
          />,
          <h4 class={this.pollingEnabled ? '' : 'disabled'}>options</h4>,
          <div class="poll-editor-options">
            <div class="poll-editor-choice-buttons">
              {this.options?.map((choice: string, index: number) => (
                <Input
                  class="poll-editor-choice"
                  placeholder={`${index + 1}.`}
                  fluid={true}
                  autocomplete="off"
                  disabled={!pollingEnabled}
                  onchange={(e) => {
                    this.options[index] = (e.target as HTMLInputElement).value;
                  }}
                />
              ))}
            </div>
            <Button
              label="Add choice"
              fluid={true}
              rounded={true}
              disabled={!pollingEnabled || this.options.length >= 6}
              onclick={() => {
                this.options.push('');
              }}
            />
            <Button
              label="Remove choice"
              fluid={true}
              rounded={true}
              disabled={!pollingEnabled || this.options.length <= 2}
              onclick={() => {
                this.options.pop();
              }}
            />
          </div>,
          <div class="poll-duration-copy">
            {getPollDurationCopy(customDuration, customDurationEnabled)}
          </div>,
          <div class="poll-editor-duration">
            <Switch
              intent="positive"
              disabled={!pollingEnabled}
              label="Custom duration"
              onchange={() => {
                this.customDurationEnabled = !this.customDurationEnabled;
                this.customDuration = 'Infinite';
              }}
            />
            <SelectList
              class="custom-duration-items"
              filterable={false}
              items={['Infinite'].concat(
                _.range(1, 31).map((n) => pluralize(Number(n), 'day'))
              )}
              itemRender={(n) => <div class="duration-item">{n}</div>}
              onSelect={(e) => {
                this.customDuration = e as string;
              }}
              trigger={
                <Button
                  disabled={!pollingEnabled || !customDurationEnabled}
                  align="left"
                  compact={true}
                  iconRight={Icons.CHEVRON_DOWN}
                  label={this.customDuration || 'Infinite'}
                  style="min-width: 200px"
                />
              }
            />
          </div>,
        ]}
        hasBackdrop={true}
        isOpen={true}
        inline={false}
        onClose={() => {
          onChangeHandler();
        }}
        title="Create poll"
        transitionDuration={200}
        footer={
          <div class={Classes.ALIGN_RIGHT}>
            <Button
              label="Cancel"
              rounded={true}
              onclick={() => {
                onChangeHandler();
              }}
            />
            <Button
              label="Save changes"
              intent="primary"
              rounded={true}
              onclick={async () => {
                if (this.pollingEnabled) {
                  if (!this.prompt) {
                    notifyError('Must set poll prompt');
                    return;
                  }
                  if (!this.options[0]?.length || !this.options[1]?.length) {
                    notifyError('Must set poll options');
                    return;
                  }
                  try {
                    console.log(this.options);
                    await app.polls.setPolling({
                      threadId: thread.id,
                      prompt: this.prompt,
                      options: this.options,
                      customDuration: this.customDuration,
                      address: app.user.activeAccount.address,
                      authorChain: app.user.activeAccount.chain.id,
                    });
                    notifySuccess('Poll creation succeeded');
                  } catch (e) {
                    console.error(e);
                  }
                  onChangeHandler();
                } else {
                  onChangeHandler();
                }
              }}
            />
          </div>
        }
      />
    );
  }
}
