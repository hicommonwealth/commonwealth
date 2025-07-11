import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import _ from 'underscore';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { pluralize } from 'helpers';
import { useCreateThreadPollMutation } from 'state/api/threads';
import useUserStore from 'state/ui/user';

import type Thread from '../../models/Thread';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWLabel } from '../components/component_kit/cw_label';
import { SelectList } from '../components/component_kit/cw_select_list';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';

import { DEFAULT_POLL_DURATION } from '@hicommonwealth/shared';
import { parseCustomDuration, SetLocalPolls } from 'utils/polls';
import CWCircleMultiplySpinner from '../components/component_kit/new_designs/CWCircleMultiplySpinner';
import './poll_editor_modal.scss';

const getPollDurationCopy = (
  customDuration: string,
  customDurationEnabled: boolean,
) => {
  if (customDurationEnabled && customDuration === 'Infinite') {
    return 'This poll will never expire.';
  } else if (customDurationEnabled && customDuration !== 'Infinite') {
    return `If started now, this poll will stay open until ${moment()
      .add(customDuration.split(' ')[0], 'days')
      .local()
      .format('lll')}.`;
  } else {
    return `By default, polls run for 5 days. If started now, this poll would stay open until
        ${moment().add(5, 'days').local().format('lll')}. Override?`;
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
  thread?: Thread;
  pollData?: string;
  isAIresponseCompleted: boolean;
  onGeneratePoll: () => void;
  setLocalPoll?: SetLocalPolls;
};

export const PollEditorModal = ({
  onModalClose,
  thread,
  pollData,
  isAIresponseCompleted,
  onGeneratePoll,
  setLocalPoll,
}: PollEditorModalProps) => {
  const [customDuration, setCustomDuration] = useState(
    `${DEFAULT_POLL_DURATION}`,
  );
  const [customDurationEnabled, setCustomDurationEnabled] = useState(false);
  const [options, setOptions] = useState(TWO_EMPTY_OPTIONS);
  const [prompt, setPrompt] = useState('');
  const modalContainerRef = useRef(null);
  const user = useUserStore();
  useEffect(() => {
    if (pollData && pollData !== undefined && isAIresponseCompleted) {
      const newPollData = JSON.parse(pollData);
      setPrompt(newPollData?.question);
      setOptions(newPollData?.options);
    }
  }, [pollData, isAIresponseCompleted]);

  const { mutateAsync: createPoll } = useCreateThreadPollMutation();

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

    const allOptionsAreFilledOut = options.every((option) => !!option.trim());

    if (!options?.length || !allOptionsAreFilledOut) {
      notifyError('Must set poll options');
      return;
    }

    if (options.length !== [...new Set(options)].length) {
      notifyError('Poll options must be unique');
      return;
    }

    try {
      if (thread) {
        await createPoll({
          thread_id: thread?.id,
          prompt,
          options,
          duration: customDurationEnabled
            ? customDuration === 'Infinite'
              ? null
              : parseInt(customDuration)
            : DEFAULT_POLL_DURATION,
        }).catch(console.error);

        notifySuccess('Poll creation succeeded');
      } else if (setLocalPoll) {
        const parsedDuration = parseCustomDuration(customDuration);
        setLocalPoll([
          {
            options: options,
            prompt: prompt,
            community_id: user.activeAccount?.community?.id,
            custom_duration: customDurationEnabled ? customDuration : undefined,
            ends_at: parsedDuration
              ? moment().add(parsedDuration, 'days').toDate()
              : undefined,
            votes: [],
          },
        ]);
      }
    } catch (err) {
      notifyError('Poll creation failed');
      console.error(err);
    }

    onModalClose();
  };

  return (
    <div className="PollEditorModal" ref={modalContainerRef}>
      <CWModalHeader label="Create Poll" onModalClose={onModalClose} />
      {!isAIresponseCompleted ? (
        <CWCircleMultiplySpinner />
      ) : (
        <>
          <CWModalBody>
            <CWTextInput
              label="Question"
              placeholder="Do you support this proposal?"
              value={prompt}
              onInput={(e) => {
                setPrompt(e.target.value);
              }}
            />
            <div className="options-and-label-container">
              <CWLabel label="Options" />
              <div className="options-container">
                {options?.map((choice, index) => (
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
                  buttonType="destructive"
                  buttonHeight="sm"
                  disabled={options?.length <= 2}
                  onClick={handleRemoveLastChoice}
                />
                <CWButton
                  label="Add choice"
                  buttonType="primary"
                  buttonHeight="sm"
                  disabled={options?.length >= 6}
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
                    menuPortalTarget={modalContainerRef?.current}
                    isSearchable={false}
                    options={customDurationOptions}
                    defaultValue={customDurationOptions[0]}
                    // @ts-expect-error <StrictNullChecks/>
                    onChange={({ value }) => setCustomDuration(value)}
                  />
                )}
              </div>
            </div>
          </CWModalBody>
          <CWModalFooter>
            <CWButton
              label="Cancel"
              buttonType="secondary"
              buttonHeight="sm"
              onClick={onModalClose}
            />
            <CWButton
              iconLeft="sparkle"
              label="Generate poll"
              buttonType="secondary"
              buttonHeight="sm"
              onClick={onGeneratePoll}
            />
            <CWButton
              label="Save changes"
              buttonType="primary"
              buttonHeight="sm"
              onClick={() => void handleSavePoll()}
            />
          </CWModalFooter>
        </>
      )}
    </div>
  );
};
