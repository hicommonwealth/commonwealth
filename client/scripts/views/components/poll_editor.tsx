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
  private choices: string[];
  private customDuration: string;
  private customDurationEnabled: boolean;
  private name: string;
  private pollingEnabled: boolean;

  view(vnode) {
    const { onChangeHandler, thread } = vnode.attrs;
    const { pollingEnabled, customDurationEnabled, customDuration } = this;

    // reset choices when initializing
    if (!this.choices || this.choices.length === 0) {
      this.choices = ['', ''];
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
              this.pollingEnabled = (e.target as any).checked;
            }}
          />,
          <h4 class={this.pollingEnabled ? '' : 'disabled'}>Question</h4>,
          <Input
            class="poll-editor-choices-question"
            name="Question"
            fluid={true}
            autocomplete="off"
            disabled={!pollingEnabled}
            placeholder="Do you support this proposal?"
            onchange={(e) => {
              this.name = (e.target as any).value;
            }}
          />,
          <h4 class={this.pollingEnabled ? '' : 'disabled'}>Choices</h4>,
          <div class="poll-editor-choices">
            <div class="poll-editor-choice-buttons">
              {this.choices?.map((choice: string, index: number) => (
                <Input
                  class="poll-editor-choice"
                  placeholder={`${index + 1}.`}
                  fluid={true}
                  autocomplete="off"
                  disabled={!pollingEnabled}
                  onchange={(e) => {
                    this.choices[index] = (e.target as any).value;
                  }}
                />
              ))}
            </div>
            <Button
              label="Add choice"
              fluid={true}
              rounded={true}
              disabled={!pollingEnabled || this.choices.length >= 6}
              onclick={() => {
                this.choices.push('');
              }}
            />
            <Button
              label="Remove choice"
              fluid={true}
              rounded={true}
              disabled={!pollingEnabled || this.choices.length <= 2}
              onclick={() => {
                this.choices.pop();
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
            ,
            <Button
              label="Save changes"
              intent="primary"
              rounded={true}
              onclick={async () => {
                if (this.pollingEnabled) {
                  if (!this.name) {
                    notifyError('Must set poll name');
                    return;
                  }
                  if (!this.choices[0]?.length || !this.choices[1]?.length) {
                    notifyError('Must set poll choices');
                    return;
                  }
                  try {
                    await app.threads.setPolling({
                      threadId: thread.id,
                      name: this.name,
                      choices: this.choices,
                      customDuration: this.customDuration,
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
