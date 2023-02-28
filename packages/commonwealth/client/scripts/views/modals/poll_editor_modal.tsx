import React, { useState } from 'react';
import _ from 'underscore';
import moment from 'moment';
import $ from 'jquery';

import 'modals/poll_editor_modal.scss';

import type { Thread } from 'models';

import app from 'state';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { pluralize } from 'helpers';
import { getNextPollEndingTime } from 'utils';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type PollEditorProps = {
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

export const PollEditorModal = ({ onModalClose, thread }: PollEditorProps) => {
  const [customDuration, setCustomDuration] = useState('');
  const [customDurationEnabled, setCustomDurationEnabled] = useState(false);
  const [options, setOptions] = useState<Array<string>>();
  const [prompt, setPrompt] = useState();

  // reset options when initializing
  if (!options || options.length === 0) {
    setOptions(['', '']);
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
          defaultValue={prompt}
          onInput={(e) => {
            setPrompt(e.target.value);
          }}
        />
        <div className="options-and-label-container">
          <CWLabel label="Options" />
          <div className="options-container">
            {options?.map((_choice: string, index: number) => (
              <CWTextInput
                placeholder={`${index + 1}.`}
                defaultValue={options[index]}
                onInput={(e) => {
                  setOptions((prevState) => ({
                    ...prevState,
                    [index]: e.target.value,
                  }));
                }}
              />
            ))}
          </div>
          <div className="buttons-row">
            <CWButton
              label="Remove choice"
              buttonType="secondary-red"
              disabled={options.length <= 2}
              onClick={() => {
                const newOptions = options.filter(
                  (o, i) => i !== options.length - 1
                );

                setOptions(newOptions);
              }}
            />
            <CWButton
              label="Add choice"
              disabled={options.length >= 6}
              onClick={() => {
                const newOptions = options.concat(['']);

                setOptions(newOptions);
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
              checked={customDurationEnabled}
              onChange={() => {
                setCustomDurationEnabled(!customDurationEnabled);
                setCustomDuration('Infinite');
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
                  customDuration = e as string;
                },
                trigger: (
                  <CWButton
                    disabled={!customDurationEnabled}
                    iconLeft="chevronDown"
                    label={customDuration || 'Infinite'}
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
            onClick={async () => {
              if (!prompt) {
                notifyError('Must set poll prompt');
                return;
              }

              if (
                !options?.length ||
                !options[0]?.length ||
                !options[1]?.length
              ) {
                notifyError('Must set poll options');
                return;
              }

              if (options.length !== [...new Set(options)].length) {
                notifyError('Poll options must be unique');
                return;
              }

              try {
                await app.polls.setPolling({
                  threadId: thread.id,
                  prompt: prompt,
                  options: options,
                  customDuration: customDuration,
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
};
