import { pluralizeWithoutNumberPrefix } from 'helpers';
import React, { useEffect, useState } from 'react';
import type { Topic } from '../../models/Topic';
import { useCommonNavigate } from '../../navigation/helpers';
import app from '../../state';
import {
  useEditTopicMutation,
  useToggleArchiveTopicMutation,
} from '../../state/api/topics';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { openConfirmation } from './confirmation_modal';

import { DISALLOWED_TOPIC_NAMES_REGEX } from '@hicommonwealth/shared';
import { useFlag } from 'client/scripts/hooks/useFlag';
import clsx from 'clsx';
import { notifySuccess } from 'controllers/app/notifications';
import { DeltaStatic } from 'quill';
import { useEditGroupMutation } from 'state/api/groups';
import useFetchGroupsQuery from 'state/api/groups/fetchGroups';
import { updateGroupTopicsBulk } from 'state/api/groups/useGroupTopicUpdater';
import useGetTopicByIdQuery from 'state/api/topics/getTopicById';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';
import { CWText } from '../components/component_kit/cw_text';
import { CWSelectList } from '../components/component_kit/new_designs/CWSelectList';
import { ReactQuillEditor } from '../components/react_quill_editor';
import './edit_topic_modal.scss';

type EditTopicModalProps = {
  onModalClose: () => void;
  topic: Topic;
  noRedirect?: boolean;
};

export const EditTopicModal = ({
  topic,
  onModalClose,
  noRedirect,
}: EditTopicModalProps) => {
  const privateTopicsEnabled = useFlag('privateTopics');

  const {
    description: descriptionProp,
    featured_in_sidebar: featuredInSidebarProp,
    id,
    name: nameProp,
  } = topic;

  const navigate = useCommonNavigate();
  const { mutateAsync: editTopic } = useEditTopicMutation();
  const { mutateAsync: archiveTopic } = useToggleArchiveTopicMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [description, setDescription] = useState<string>(descriptionProp);
  const [newPostTemplate, setNewPostTemplate] = useState<DeltaStatic>(
    topic?.default_offchain_template
      ? JSON.parse(decodeURIComponent(topic?.default_offchain_template))
      : '',
  );
  const [newPostTemplateError, setNewPostTemplateError] = useState<
    string | null
  >(null);
  const [featuredInSidebar, setFeaturedInSidebar] = useState<boolean>(
    featuredInSidebarProp,
  );
  const [featuredInNewPost, setFeaturedInNewPost] = useState<boolean>(
    topic?.featured_in_new_post || false,
  );
  const [name, setName] = useState<string>(nameProp);
  const [characterCount, setCharacterCount] = useState(0);
  const [descErrorMsg, setDescErrorMsg] = useState<string | null>(null);

  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const communityId = app.activeChainId() || '';

  const { data: groups } = useFetchGroupsQuery({
    communityId: communityId,
    enabled: !!communityId,
  });

  const { data: topicData } = useGetTopicByIdQuery({
    topicId: id ?? 0,
    includeGatingGroups: true,
    apiEnabled: !!id,
  });

  useEffect(() => {
    if (topicData?.gatingGroups) {
      setSelectedGroups(topicData.gatingGroups.map((g) => g.id));
      setIsPrivate(topicData.gatingGroups.some((g) => g.is_private));
    }
  }, [topicData]);

  const { mutateAsync: editGroup } = useEditGroupMutation({
    communityId: app.activeChainId() || '',
  });

  const getCharacterCount = (delta) => {
    if (!delta || !delta.ops) {
      if (typeof delta === 'string' && delta.length) return delta.length;
      return 0;
    }
    return delta.ops.reduce((count, op) => {
      if (typeof op.insert === 'string') {
        const cleanedText = op.insert.replace(/\n$/, '');
        return count + cleanedText.length;
      }
      return count;
    }, 0);
  };

  useEffect(() => {
    const count = getCharacterCount(description);
    setCharacterCount(count);
  }, [description]);

  useEffect(() => {
    if (description?.length > 250) {
      setDescErrorMsg('Description must be 250 characters or less');
    } else {
      setDescErrorMsg(null);
    }
  }, [description]);

  useEffect(() => {
    if (
      featuredInNewPost &&
      (newPostTemplate?.ops || [])?.[0]?.insert?.trim?.()?.length === 0
    ) {
      setNewPostTemplateError('Topic template is required');
    } else {
      setNewPostTemplateError(null);
    }
  }, [featuredInNewPost, newPostTemplate]);

  const handleSaveChanges = async () => {
    setIsSaving(true);

    try {
      await editTopic({
        topic_id: id!,
        description: JSON.stringify(description),
        name: name,
        community_id: app.activeChainId()!,
        telegram: null,
        featured_in_sidebar: featuredInSidebar,
        featured_in_new_post: featuredInNewPost,
        default_offchain_template:
          featuredInNewPost && newPostTemplate
            ? JSON.stringify(newPostTemplate)
            : '',
      });

      const updatedTopicId = id;
      const prevGroupIds = topicData?.gatingGroups?.map((g) => g.id) || [];
      const groupsToRemove = prevGroupIds.filter(
        (id) => !selectedGroups.includes(id),
      );

      if (typeof updatedTopicId === 'number') {
        await updateGroupTopicsBulk({
          groupIds: groupsToRemove,
          topicId: updatedTopicId,
          editGroup,
          remove: true,
        });
        await updateGroupTopicsBulk({
          groupIds: selectedGroups,
          topicId: updatedTopicId,
          name,
          editGroup,
        });
      }

      if (noRedirect) {
        onModalClose();
        notifySuccess('Settings saved.');
      } else {
        notifySuccess('Settings saved.');
        navigate(`/discussions/${encodeURI(name.toString().trim())}`);
      }
    } catch (err) {
      setErrorMsg(err.message || err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveTopic = () => {
    openConfirmation({
      title: topic.archived_at
        ? 'Unarchive this topic?'
        : 'Archive this topic?',
      description: (
        <>
          {topic.archived_at ? (
            <CWText>
              Unarchiving this topic will mark all of its threads as unarchived
              (only those threads that were marked archived when this topic was
              archived). Users will be able to interact with those threads
              normally.
            </CWText>
          ) : (
            <CWText>
              Archiving this topic will mark all of its threads as archived.
              Users can still see archived threads in the archived section.
            </CWText>
          )}
        </>
      ),
      buttons: [
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
        {
          label: topic.archived_at ? 'Unarchive' : 'Archive',
          buttonType: topic.archived_at ? 'primary' : 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            await archiveTopic({
              community_id: app.activeChainId() || '',
              topic_id: id!,
              archive: !topic.archived_at,
            }).catch(console.error);
            if (noRedirect) {
              onModalClose();
            } else {
              navigate('/');
            }
          },
        },
      ],
    });
  };

  return (
    <div className="EditTopicModal">
      <CWModalHeader label="Edit topic" onModalClose={onModalClose} />
      <CWModalBody>
        <CWTextInput
          label="Name"
          value={name}
          disabled={!!topic.archived_at}
          onInput={(e) => {
            setName(e.target.value);
          }}
          inputValidationFn={(text: string) => {
            let newErrorMsg;

            const disallowedCharMatches = text.match(
              DISALLOWED_TOPIC_NAMES_REGEX,
            );
            if (disallowedCharMatches) {
              newErrorMsg = `The ${pluralizeWithoutNumberPrefix(
                disallowedCharMatches.length,
                'char',
              )}
                ${disallowedCharMatches.join(', ')} are not permitted`;
              setErrorMsg(newErrorMsg);
              return ['failure', newErrorMsg];
            }

            if (errorMsg) {
              setErrorMsg(null);
            }

            return ['success', 'Valid topic name'];
          }}
        />

        <CWTextInput
          label="Description"
          placeholder="description"
          name="description"
          value={description}
          onInput={(e) => {
            setDescription(e.target.value);
          }}
          // @ts-expect-error <StrictNullChecks/>
          customError={descErrorMsg}
          disabled={!!topic.archived_at}
        />

        <div className="char-error-row">
          <CWText type="caption">Character count: {characterCount}/250</CWText>
          <MessageRow
            statusMessage={descErrorMsg || ''}
            hasFeedback={!!descErrorMsg}
            validationStatus={descErrorMsg ? 'failure' : undefined}
          />

          {featuredInNewPost && (
            <MessageRow
              statusMessage={newPostTemplateError || ''}
              hasFeedback={!!newPostTemplateError}
              validationStatus={newPostTemplateError ? 'failure' : undefined}
            />
          )}
        </div>
        <CWCheckbox
          label="Featured in Sidebar"
          checked={featuredInSidebar}
          onChange={() => {
            setFeaturedInSidebar(!featuredInSidebar);
          }}
          value=""
          disabled={!!topic.archived_at}
        />
        {privateTopicsEnabled && (
          <CWCheckbox
            label="Private topic"
            checked={isPrivate}
            onChange={() => setIsPrivate(!isPrivate)}
            disabled={!!topic.archived_at}
          />
        )}
        {privateTopicsEnabled && isPrivate && (
          <CWSelectList
            isMulti
            label="Allowed groups"
            options={groups?.map((g) => ({ label: g.name, value: g.id }))}
            value={groups
              ?.filter((g) => selectedGroups.includes(g.id))
              .map((g) => ({ label: g.name, value: g.id }))}
            onChange={(selected) =>
              setSelectedGroups(selected.map((opt) => opt.value))
            }
          />
        )}
        <div
          className={clsx(
            'new-topic-template-section',
            featuredInNewPost && 'enabled',
          )}
        >
          <CWCheckbox
            className="sidebar-feature-checkbox"
            label={
              <div>
                <CWText type="b2">Featured topic in new post</CWText>
                <CWText type="caption" className="checkbox-label-caption">
                  The topic template you add will be added as base text to every
                  new post within the topic.
                </CWText>
              </div>
            }
            checked={featuredInNewPost}
            onChange={() => {
              setFeaturedInNewPost(!featuredInNewPost);
            }}
          />
          {featuredInNewPost && (
            <ReactQuillEditor
              placeholder="Add a template for this topic (Limit of 250 characters)"
              contentDelta={newPostTemplate}
              setContentDelta={setNewPostTemplate}
            />
          )}
        </div>
      </CWModalBody>
      <CWModalFooter className="EditTopicModalFooter">
        <div className="action-buttons">
          <div className="delete-topic">
            <CWButton
              buttonType={topic.archived_at ? 'primary' : 'destructive'}
              {...(topic.archived_at && { buttonAlt: 'green' })}
              buttonHeight="sm"
              disabled={isSaving}
              onClick={handleArchiveTopic}
              label={topic.archived_at ? 'Unarchive topic' : 'Archive topic'}
            />
          </div>
          <CWButton
            label="Cancel"
            buttonType="secondary"
            buttonHeight="sm"
            onClick={onModalClose}
            disabled={!!topic.archived_at}
          />
          <CWButton
            buttonType="primary"
            buttonHeight="sm"
            onClick={handleSaveChanges}
            label="Save changes"
            disabled={
              !!topic.archived_at ||
              !!descErrorMsg ||
              (featuredInNewPost && !!newPostTemplateError)
            }
          />
        </div>
        {errorMsg && (
          <CWValidationText
            className="error-message"
            message={errorMsg}
            status="failure"
          />
        )}
      </CWModalFooter>
    </div>
  );
};
