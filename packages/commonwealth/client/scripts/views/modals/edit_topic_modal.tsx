import React, { useEffect, useState } from 'react';

import { pluralizeWithoutNumberPrefix } from 'helpers';

import 'modals/edit_topic_modal.scss';
import { Topic } from 'models';

import app from 'state';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';

import { CWButton } from '../components/component_kit/cw_button';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import type { QuillEditor } from '../components/quill/quill_editor';
import type { QuillTextContents } from '../components/quill/types';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { useCommonNavigate } from 'navigation/helpers';

type EditTopicModalProps = {
  onModalClose: () => void;
  topic: Topic;
};

export const EditTopicModal = ({
  topic,
  onModalClose,
}: EditTopicModalProps) => {
  const {
    defaultOffchainTemplate,
    description: descriptionProp,
    featuredInNewPost: featuredInNewPostProp,
    featuredInSidebar: featuredInSidebarProp,
    id,
    name: nameProp,
  } = topic;

  const navigate = useCommonNavigate();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quillEditorState, setQuillEditorState] = useState<QuillEditor>();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [contentsDoc, setContentsDoc] = useState<QuillTextContents>();

  const [description, setDescription] = useState<string>(descriptionProp);
  const [featuredInNewPost, setFeaturedInNewPost] = useState<boolean>(
    featuredInNewPostProp
  );
  const [featuredInSidebar, setFeaturedInSidebar] = useState<boolean>(
    featuredInSidebarProp
  );
  const [name, setName] = useState<string>(nameProp);

  useEffect(() => {
    if (defaultOffchainTemplate) {
      try {
        setContentsDoc(JSON.parse(defaultOffchainTemplate));
      } catch (e) {
        setContentsDoc(defaultOffchainTemplate);
      }
    }
  }, [defaultOffchainTemplate]);

  const handleSaveChanges = async () => {
    setIsSaving(true);

    if (featuredInNewPost) {
      if (!quillEditorState || quillEditorState?.isBlank()) {
        setErrorMsg('Must provide template.');
      } else {
        quillEditorState?.disable();
      }
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
        ? quillEditorState.textContentsAsString
        : null,
    };

    try {
      await app.topics.edit(new Topic(topicInfo));
      navigate(`/discussions/${encodeURI(name.toString().trim())}`);
    } catch (err) {
      setErrorMsg(err.message || err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTopic = async () => {
    const confirmed = window.confirm('Delete this topic?');

    if (!confirmed) {
      return;
    }

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
          <QuillEditorComponent
            contentsDoc={contentsDoc}
            oncreateBind={(state: QuillEditor) => {
              setQuillEditorState(state);
            }}
            editorNamespace="new-discussion"
            tabIndex={3}
          />
        )}
        <div className="buttons-row">
          <CWButton onClick={handleSaveChanges} label="Save changes" />
          <CWButton
            buttonType="primary-red"
            disabled={isSaving}
            onClick={handleDeleteTopic}
            label="Delete topic"
          />
        </div>
        {errorMsg && <CWValidationText message={errorMsg} status="failure" />}
      </div>
    </div>
  );
};
