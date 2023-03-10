import React from 'react';

import $ from 'jquery';
import { pluralizeWithoutNumberPrefix } from 'helpers';

import 'modals/edit_topic_modal.scss';
import { Topic } from 'models';

import app from 'state';

import { CWButton } from '../components/component_kit/cw_button';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { useCommonNavigate } from 'navigation/helpers';
import { DeltaStatic } from 'quill';
import { EMPTY_OPS, ReactQuillEditor } from '../components/react_quill_editor';

type EditTopicModalProps = {
  defaultOffchainTemplate: string;
  description: string;
  featuredInNewPost: boolean;
  featuredInSidebar: boolean;
  id: number;
  onModalClose: () => void;
  name: string;
};

export const EditTopicModal = (props: EditTopicModalProps) => {
  const {
    defaultOffchainTemplate,
    description: descriptionProp,
    featuredInNewPost: featuredInNewPostProp,
    featuredInSidebar: featuredInSidebarProp,
    id,
    onModalClose,
    name: nameProp,
  } = props;

  const navigate = useCommonNavigate();

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [contentDelta, setContentDelta] = React.useState<DeltaStatic>(EMPTY_OPS);
  const [editorValue, setEditorValue] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  const [description, setDescription] = React.useState<string>(descriptionProp);
  const [featuredInNewPost, setFeaturedInNewPost] = React.useState<boolean>(
    featuredInNewPostProp
  );
  const [featuredInSidebar, setFeaturedInSidebar] = React.useState<boolean>(
    featuredInSidebarProp
  );
  const [name, setName] = React.useState<string>(nameProp);


  const updateTopic = async () => {
    if (featuredInNewPost && editorValue.length === 0) {
      setErrorMsg('Must provide template.');
    }

    const topicInfo = {
      id,
      description: description,
      name: name,
      chain_id: app.activeChainId(),
      telegram: null,
      featured_in_sidebar: featuredInSidebar,
      featured_in_new_post: featuredInNewPost,
      default_offchain_template: featuredInNewPost
        ? editorValue
        : null,
    };

    try {
      await app.topics.edit(new Topic(topicInfo));
      return true;
    } catch (err) {
      setErrorMsg(err.message || err);
      return false;
    }
  };

  const deleteTopic = async () => {
    const topicInfo = {
      id,
      name: name,
      chainId: app.activeChainId(),
    };

    await app.topics.remove(topicInfo);

    navigate('/');
  };

  return (
    <div className="EditTopicModal">
      <div className="compact-modal-title">
        <h3>Edit topic</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
      </div>
      <div className="compact-modal-body">
        <CWTextInput
          label="Name"
          value={name}
          onInput={(e) => {
            setName(e.target.value);
          }}
          inputValidationFn={(text: string) => {
            let newErrorMsg;

            const disallowedCharMatches = text.match(/["<>%{}|\\/^`]/g);
            if (disallowedCharMatches) {
              newErrorMsg = `The ${pluralizeWithoutNumberPrefix(
                disallowedCharMatches.length,
                'char'
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
          name="description"
          tabIndex={2}
          value={description}
          onInput={(e) => {
            setDescription(e.target.value);
          }}
        />
        <CWCheckbox
          label="Featured in Sidebar"
          checked={featuredInSidebar}
          onChange={() => {
            setFeaturedInSidebar(!featuredInSidebar);
          }}
          value=""
        />
        <CWCheckbox
          label="Featured in New Post"
          checked={featuredInNewPost}
          onChange={() => {
            setFeaturedInNewPost(!featuredInNewPost);
          }}
          value=""
        />
        {featuredInNewPost && (
          <ReactQuillEditor
            contentDelta={contentDelta}
            setContentDelta={setContentDelta}
            onChange={(v) => setEditorValue(v)}
          />
        )}
        <div className="buttons-row">
          <CWButton
            onClick={async (e) => {
              e.preventDefault();

              updateTopic()
                .then((closeModal) => {
                  if (closeModal) {
                    $(e.target).trigger('modalexit');
                    navigate(
                      `/discussions/${encodeURI(name.toString().trim())}`
                    );
                  }
                })
                .catch(() => {
                  setIsSaving(false);
                  // redraw();
                });
            }}
            label="Save changes"
          />
          <CWButton
            buttonType="primary-red"
            disabled={isSaving}
            onClick={async (e) => {
              e.preventDefault();
              const confirmed = window.confirm('Delete this topic?');

              if (!confirmed) return;

              deleteTopic()
                .then(() => {
                  $(e.target).trigger('modalexit');
                  navigate('/');
                })
                .catch(() => {
                  setIsSaving(false);
                  // redraw();
                });
            }}
            label="Delete topic"
          />
        </div>
        {errorMsg && <CWValidationText message={errorMsg} status="failure" />}
      </div>
    </div>
  );
};
