import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { pluralize } from 'helpers';

import 'modals/poll_editor_modal.scss';
import moment from 'moment';
import React, { useState } from 'react';


import app from 'state';
import _ from 'underscore';
import { getNextPollEndingTime } from 'utils';
import { SelectList } from 'views/components/component_kit/cw_select_list';
import type Thread from '../../models/Thread';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';

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

const TWO_EMPTY_OPTIONS = Array<string>(2).fill('');
const INFINITE_OPTION = 'Infinite';
const customDurationOptions = [
  INFINITE_OPTION,
  ..._.range(1, 31).map((n) => pluralize(Number(n), 'day')),
].map((option) => ({ value: option, label: option }));

type PollEditorModalProps = {
  onModalClose: () => void;
  thread: Thread;
  onPollCreate: () => void;
};

export const PollEditorModal = ({
  onModalClose,
  thread,
  onPollCreate,
}: PollEditorModalProps) => {
  const [customDuration, setCustomDuration] = useState(INFINITE_OPTION);
  const [customDurationEnabled, setCustomDurationEnabled] = useState(false);
  const [options, setOptions] = useState(TWO_EMPTY_OPTIONS);
  const [prompt, setPrompt] = useState('');

  const handleInputChange = (value: string, index: number) => {
    setOptions((prevState) => {
      const arrCopy = [...prevState];
      arrCopy[index] = value;
      return arrCopy;
    });
  };

  const handleRemoveLastChoice = () => {
    setOptions((prevState) => prevState.slice(0, -1));
  };

  const handleAddChoice = () => {
    setOptions((prevState) => [...prevState, '']);
  };

  const handleCustomDurationChange = () => {
    setCustomDuration(INFINITE_OPTION);
    setCustomDurationEnabled((prevState) => !prevState);
  };

  const handleSavePoll = async () => {
    if (!prompt) {
      notifyError('Must set poll prompt');
      return;
    }

    if (!options?.length || !options[0]?.length || !options[1]?.length) {
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
        prompt,
        options,
        customDuration: customDurationEnabled ? customDuration : null,
        address: app.user.activeAccount.address,
        authorChain: app.user.activeAccount.chain.id,
      });
      notifySuccess('Poll creation succeeded');
      onPollCreate();
    } catch (err) {
      console.error(err);
    }

    onModalClose();
  };

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
            {options.map((choice, index) => (
              <CWTextInput
                key={index}
                placeholder={`${index + 1}.`}
                value={choice}
                onInput={(e) => handleInputChange(e.target.value, index)}
              />
            ))}
          </div>
          <div className="buttons-row">
            <CWButton
              label="Remove choice"
              buttonType="secondary-red"
              disabled={options.length <= 2}
              onClick={handleRemoveLastChoice}
            />
            <CWButton
              label="Add choice"
              disabled={options.length >= 6}
              onClick={handleAddChoice}
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
              onChange={handleCustomDurationChange}
              value=""
            />
            {customDurationEnabled && (
              <SelectList
                isSearchable={false}
                options={customDurationOptions}
                defaultValue={customDurationOptions[0]}
                onChange={({ value }) => setCustomDuration(value)}
              />
            )}
          </div>
        </div>
        <div className="buttons-row">
          <CWButton
            label="Cancel"
            buttonType="secondary-blue"
            onClick={onModalClose}
          />
          <CWButton label="Save changes" onClick={handleSavePoll} />
        </div>
      </div>
    </div>
  );
};
