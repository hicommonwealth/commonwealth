import React, { useEffect } from 'react';

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
import { useCommonNavigate } from 'navigation/helpers';
import type { DeltaStatic } from 'quill';
import {
  createDeltaFromText,
  getTextFromDelta,
  ReactQuillEditor,
} from '../components/react_quill_editor';
import { serializeDelta } from '../components/react_quill_editor/utils';
import { useCreateTopicMutation } from 'state/api/topics';

type NewTopicModalProps = {
  onModalClose: () => void;
};

export const NewTopicModal = (props: NewTopicModalProps) => {
  const { onModalClose } = props;
  const { mutateAsync: createTopic } = useCreateTopicMutation();
  const navigate = useCommonNavigate();

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [contentDelta, setContentDelta] = React.useState<DeltaStatic>(
    createDeltaFromText('')
  );
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [description, setDescription] = React.useState<string>('');
  const [featuredInNewPost, setFeaturedInNewPost] =
    React.useState<boolean>(false);
  const [featuredInSidebar, setFeaturedInSidebar] =
    React.useState<boolean>(false);
  const [name, setName] = React.useState<string>('');
  const [tokenThreshold, setTokenThreshold] = React.useState<string>('0');

  const editorText = getTextFromDelta(contentDelta);

  useEffect(() => {
    if (!name || !name.trim()) {
      setErrorMsg('Name must be specified.');
      return;
    }
    if (featuredInNewPost && editorText.length === 0) {
      setErrorMsg('Must add template.');
      return;
    }
    setErrorMsg(null);
  }, [name, featuredInNewPost, editorText]);

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
          disabled={isSaving || !!errorMsg}
          onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();

            try {
              await createTopic({
                name,
                description,
                featuredInSidebar,
                featuredInNewPost,
                tokenThreshold,
                defaultOffchainTemplate: serializeDelta(contentDelta),
              });

              navigate(`/discussions/${encodeURI(name.toString().trim())}`);

              onModalClose();
            } catch (err) {
              setErrorMsg('Error creating topic');
              setIsSaving(false);
            }
          }}
        />
        {errorMsg && <CWValidationText message={errorMsg} status="failure" />}{' '}
      </div>
    </div>
  );
};
