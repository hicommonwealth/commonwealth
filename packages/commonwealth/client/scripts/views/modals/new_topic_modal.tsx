import React from 'react';

import { ChainBase, ChainNetwork } from 'common-common/src/types';

import { pluralizeWithoutNumberPrefix } from 'helpers';

import 'modals/new_topic_modal.scss';
import app from 'state';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { TokenDecimalInput } from 'views/components/token_decimal_input';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { DeltaStatic } from 'quill';
import { createDeltaFromText, getTextFromDelta, ReactQuillEditor } from '../components/react_quill_editor';

type NewTopicModalProps = {
  onModalClose: () => void;
};

export const NewTopicModal = (props: NewTopicModalProps) => {
  const { onModalClose } = props;

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [contentDelta, setContentDelta] = React.useState<DeltaStatic>(createDeltaFromText(''));
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [description, setDescription] = React.useState<string>('');
  const [featuredInNewPost, setFeaturedInNewPost] =
    React.useState<boolean>(false);
  const [featuredInSidebar, setFeaturedInSidebar] =
    React.useState<boolean>(false);
  const [name, setName] = React.useState<string>('');
  const [tokenThreshold, setTokenThreshold] = React.useState<string>('0');

  const editorValue = getTextFromDelta(contentDelta);

  const hasValidationError = React.useMemo(() => {
    if (!name || name.trim().length === 0) {
      return true
    }
    if (featuredInNewPost && editorValue.length === 0) {
      return true
    }
    return false
  }, [name, featuredInNewPost, editorValue])

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
          <ReactQuillEditor
            contentDelta={contentDelta}
            setContentDelta={setContentDelta}
          />
        )}
        <CWButton
          label="Create topic"
          disabled={isSaving || !!errorMsg || hasValidationError}
          onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
            try {
              e.preventDefault();
              setIsSaving(true)

              await app.topics.add(
                name,
                description,
                null,
                featuredInSidebar,
                featuredInNewPost,
                tokenThreshold || '0',
                editorValue
              );

              onModalClose();
            } catch (err) {
              setErrorMsg('Error creating topic');
            } finally {
              setIsSaving(false);
            }
          }}
        />
        {errorMsg && <CWValidationText message={errorMsg} status="failure" />}{' '}
      </div>
    </div>
  );
};
