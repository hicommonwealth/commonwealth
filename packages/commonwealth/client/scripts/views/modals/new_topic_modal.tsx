import React from 'react';

import { redraw } from 'mithrilInterop';

import { ChainBase, ChainNetwork } from 'common-common/src/types';

import { pluralizeWithoutNumberPrefix } from 'helpers';

import 'modals/new_topic_modal.scss';
import app from 'state';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import type { QuillEditor } from 'views/components/quill/quill_editor';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { TokenDecimalInput } from 'views/components/token_decimal_input';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { DeltaStatic } from 'quill';
import { createDeltaFromText, getTextFromDelta, ReactQuillEditor } from '../components/react_quill_editor';
import { useCommonNavigate } from 'navigation/helpers';

type NewTopicModalProps = {
  onModalClose: () => void;
};

export const NewTopicModal = (props: NewTopicModalProps) => {
  const { onModalClose } = props;

  const navigate = useCommonNavigate();

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [quillEditorState, setQuillEditorState] = React.useState<QuillEditor>();
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [description, setDescription] = React.useState<string>('');
  const [featuredInNewPost, setFeaturedInNewPost] =
    React.useState<boolean>(false);
  const [featuredInSidebar, setFeaturedInSidebar] =
    React.useState<boolean>(false);
  const [name, setName] = React.useState<string>('');
  const [tokenThreshold, setTokenThreshold] = React.useState<string>('0');
  const [submitIsDisabled, setSubmitIsDisabled] =
    React.useState<boolean>(false);

  React.useEffect(() => {
    if (!name || !name.trim()) {
      setSubmitIsDisabled(true);
    }

    if (featuredInNewPost && quillEditorState && quillEditorState.isBlank()) {
      setSubmitIsDisabled(true);
    }
  }, [name, featuredInNewPost, quillEditorState]);

  const decimals = app.chain?.meta?.decimals
    ? app.chain.meta.decimals
    : app.chain.network === ChainNetwork.ERC721
    ? 0
    : app.chain.base === ChainBase.CosmosSDK
    ? 6
    : 18;

  return (
    <div className="NewTopicModal">
      <div className="compact-modal-title">
        <h3>New topic</h3>
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
            const currentCommunityTopicNames = app.topics
              .getByCommunity(app.activeChainId())
              .map((t) => t.name.toLowerCase());

            if (currentCommunityTopicNames.includes(text.toLowerCase())) {
              const err = 'Topic name already used within community.';
              setErrorMsg(err);
              redraw();
              return ['failure', err];
            }

            const disallowedCharMatches = text.match(/["<>%{}|\\/^`]/g);

            if (disallowedCharMatches) {
              const err = `The ${pluralizeWithoutNumberPrefix(
                disallowedCharMatches.length,
                'char'
              )} 
                ${disallowedCharMatches.join(', ')} are not permitted`;
              setErrorMsg(err);
              redraw();
              return ['failure', err];
            }

            if (errorMsg) {
              setErrorMsg(null);
            }

            return ['success', 'Valid topic name'];
          }}
          autoFocus
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
        {app.activeChainId() && (
          <React.Fragment>
            <CWLabel
              label={`Number of tokens needed to post (${app.chain?.meta.default_symbol})`}
            />
            <TokenDecimalInput
              decimals={decimals}
              defaultValueInWei="0"
              onInputChange={(newValue: string) => {
                setTokenThreshold(newValue);
              }}
            />
          </React.Fragment>
        )}
        <div className="checkboxes">
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
        </div>
        {featuredInNewPost && (
          <QuillEditorComponent
            contentsDoc=""
            oncreateBind={(state: QuillEditor) => {
              setQuillEditorState(state);
            }}
            editorNamespace="new-discussion"
          />
        )}
        <CWButton
          label="Create topic"
          disabled={isSaving || !!errorMsg || submitIsDisabled}
          onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();

            try {
              let defaultOffchainTemplate;

              if (quillEditorState) {
                quillEditorState.disable();
                defaultOffchainTemplate = quillEditorState.textContentsAsString;
              }

              await app.topics.add(
                name,
                description,
                null,
                featuredInSidebar,
                featuredInNewPost,
                tokenThreshold || '0',
                defaultOffchainTemplate as string
              );

              navigate(`/discussions/${encodeURI(name.toString().trim())}`);

              onModalClose();
            } catch (err) {
              setErrorMsg('Error creating topic');
              setIsSaving(false);
              if (quillEditorState) {
                quillEditorState.enable();
              }
              redraw();
            }
          }}
        />
        {errorMsg && <CWValidationText message={errorMsg} status="failure" />}{' '}
      </div>
    </div>
  );
};
