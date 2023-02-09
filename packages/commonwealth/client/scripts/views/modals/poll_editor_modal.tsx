import React from 'react';

import { ClassComponent} from

 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';
import $ from 'jquery';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { pluralize } from 'helpers';

import 'modals/poll_editor_modal.scss';
import type { Thread } from 'models';
import moment from 'moment';
import app from 'state';
import _ from 'underscore';

import { getNextPollEndingTime } from 'utils';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type PollEditorAttrs = {
  onModalClose: () => void;
  thread: Thread;
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
    return `By default, polls run for at least 5 days, ending on the 1st
        and 15th of each month. If started now, this poll would stay open until
        ${getNextPollEndingTime(moment()).local().format('lll')}. Override?`;
  }
};

export class PollEditorModal extends ClassComponent<PollEditorAttrs> {
  private customDuration: string;
  private customDurationEnabled: boolean;
  private options: Array<string>;
  private prompt: string;

  view(vnode: ResultNode<PollEditorAttrs>) {
    const { onModalClose, thread } = vnode.attrs;
    const { customDurationEnabled, customDuration } = this;

    // reset options when initializing
    if (!this.options || this.options.length === 0) {
      this.options = ['', ''];
    }

    return (
      <div className="PollEditorModal">
        <div className="compact-modal-title">
          <h3>Create Poll</h3>
          <CWIconButton iconName="close" onClick={() => onModalClose()} />
        </div>
        <div className="compact-modal-body">
          <CWTextInput
            label="Question"
            placeholder="Do you support this proposal?"
            defaultValue={this.prompt}
            onInput={(e) => {
              this.prompt = (e.target as HTMLInputElement).value;
            }}
          />
          <div className="options-and-label-container">
            <CWLabel label="Options" />
            <div className="options-container">
              {this.options?.map((_choice: string, index: number) => (
                <CWTextInput
                  placeholder={`${index + 1}.`}
                  defaultValue={this.options[index]}
                  onInput={(e) => {
                    this.options[index] = (e.target as HTMLInputElement).value;
                  }}
                />
              ))}
            </div>
            <div className="buttons-row">
              <CWButton
                label="Remove choice"
                buttonType="secondary-red"
                disabled={this.options.length <= 2}
                onClick={() => {
                  this.options.pop();
                }}
              />
              <CWButton
                label="Add choice"
                disabled={this.options.length >= 6}
                onClick={() => {
                  this.options.push('');
                }}
              />
            </div>
          </div>
          <div className="duration-row">
            <CWText type="caption" className="poll-duration-text">
              {getPollDurationCopy(customDuration, customDurationEnabled)}
            </CWText>
            <div className="duration-row-actions">
              <CWCheckbox
                label="Custom duration"
                checked={this.customDurationEnabled}
                onChange={() => {
                  this.customDurationEnabled = !this.customDurationEnabled;
                  this.customDuration = 'Infinite';
                }}
                value=""
              />
              {/* {m(SelectList, { // @TODO @REACT FIX ME
                filterable: false,
                items: ['Infinite'].concat(
                  _.range(1, 31).map((n) => pluralize(Number(n), 'day'))
                ),
                itemRender: (n) => <div className="duration-item">{n}</div>,
                onSelect: (e) => {
                  this.customDuration = e as string;
                },
                trigger: (
                  <CWButton
                    disabled={!customDurationEnabled}
                    iconLeft="chevronDown"
                    label={this.customDuration || 'Infinite'}
                  />
                ),
              })} */}
            </div>
          </div>
          <div className="buttons-row">
            <CWButton
              label="Cancel"
              buttonType="secondary-blue"
              onClick={() => {
                onModalClose();
              }}
            />
            <CWButton
              label="Save changes"
              onClick={async (e) => {
                if (!this.prompt) {
                  notifyError('Must set poll prompt');
                  return;
                }

                if (
                  !this.options?.length ||
                  !this.options[0]?.length ||
                  !this.options[1]?.length
                ) {
                  notifyError('Must set poll options');
                  return;
                }

                if (this.options.length !== [...new Set(this.options)].length) {
                  notifyError('Poll options must be unique');
                  return;
                }

                try {
                  await app.polls.setPolling({
                    threadId: thread.id,
                    prompt: this.prompt,
                    options: this.options,
                    customDuration: this.customDuration,
                    address: app.user.activeAccount.address,
                    authorChain: app.user.activeAccount.chain.id,
                  });
                  notifySuccess('Poll creation succeeded');
                } catch (err) {
                  console.error(err);
                }

                onModalClose();
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}
