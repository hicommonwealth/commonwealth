import { notifyError } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useEffect, useState } from 'react';
import PageCounter from 'views/components/PageCounter';
import { CWImageInput } from 'views/components/component_kit/CWImageInput';
import { ImageBehavior } from 'views/components/component_kit/CWImageInput/types';
import { CWText } from 'views/components/component_kit/cw_text';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { useCommunityCreationService } from '../services/CommunityCreationService';
import './CommunityCreationForm.scss';

type CommunityCreationFormProps = {
  onCancel?: () => void;
  initialPrompt?: string;
  generateOnMount?: boolean;
};

export const CommunityCreationForm: React.FC<CommunityCreationFormProps> = ({
  onCancel,
  initialPrompt,
  generateOnMount = false,
}) => {
  const [userPrompt, setUserPrompt] = useState(initialPrompt || '');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const navigate = useCommonNavigate();

  const {
    generateIdea,
    generatedCommunityIdea,
    isMaxCommunityIdeaLimitReached,
    activeCommunityIdeaIndex,
    setActiveCommunityIdeaIndex,
    communityIdeas,
    updateCommunityIdeaByIndex,
    createCommunity,
    isCreatingCommunity,
    createdCommunityId,
    generateInitialThreads,
  } = useCommunityCreationService();

  // Generate initial idea on mount if requested
  useEffect(() => {
    if (generateOnMount && initialPrompt) {
      generateIdea(initialPrompt).catch(console.error);
    }
  }, [generateOnMount, initialPrompt, generateIdea]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!generatedCommunityIdea?.community) {
      notifyError('Please generate a community idea first');
      return;
    }

    try {
      // Create the community
      const communityId = await createCommunity(userPrompt);

      if (communityId) {
        // Generate initial threads in the background
        generateInitialThreads(communityId, userPrompt).catch(console.error);

        // Navigate to the new community
        navigate(`/${communityId}`);
      }
    } catch (error) {
      console.error('Error during community creation:', error);
      notifyError('Failed to create community');
    }
  }, [
    generatedCommunityIdea,
    createCommunity,
    navigate,
    generateInitialThreads,
    userPrompt,
  ]);

  // Handle form field updates
  const handleFieldUpdate = useCallback(
    (field: string, value: string) => {
      if (!generatedCommunityIdea?.community) return;

      updateCommunityIdeaByIndex(
        {
          ...generatedCommunityIdea.community,
          [field]: value,
        },
        activeCommunityIdeaIndex,
      );
    },
    [
      generatedCommunityIdea,
      updateCommunityIdeaByIndex,
      activeCommunityIdeaIndex,
    ],
  );

  // Handle image upload
  const handleImageChange = useCallback(
    (url: string) => {
      handleFieldUpdate('imageURL', url);
    },
    [handleFieldUpdate],
  );

  // Handle initial AI generation
  const handleGenerateIdea = useCallback(() => {
    generateIdea(userPrompt).catch(console.error);
  }, [generateIdea, userPrompt]);

  // Handle processing change
  const handleProcessingChange = useCallback(
    (processing: { isGenerating: boolean; isUploading: boolean }) => {
      setIsProcessingImage(processing.isGenerating || processing.isUploading);
    },
    [],
  );

  if (isCreatingCommunity) {
    return (
      <div className="CommunityCreationForm creating">
        <CWText type="h3">Creating your community</CWText>
        <CWCircleMultiplySpinner />
      </div>
    );
  }

  return (
    <div className="CommunityCreationForm">
      <CWText type="h3">Create Community</CWText>

      {!generatedCommunityIdea?.community ? (
        <div className="prompt-input-section">
          <CWText type="b2">Describe the community you want to create:</CWText>
          <CWTextInput
            placeholder="E.g. A community focused on blockchain development and web3 technologies"
            value={userPrompt}
            onInput={(e) => setUserPrompt(e.target.value)}
          />
          <CWButton
            label="Generate Community"
            buttonHeight="med"
            iconLeft="brain"
            onClick={handleGenerateIdea}
            disabled={!userPrompt.trim()}
          />
        </div>
      ) : (
        <div className="community-form">
          <div className="community-form-fields">
            <div className="form-field">
              <CWText type="h5">Community Name</CWText>
              <CWTextInput
                placeholder="Enter community name"
                value={generatedCommunityIdea.community.name}
                onInput={(e) => handleFieldUpdate('name', e.target.value)}
              />
            </div>

            <div className="form-field">
              <CWText type="h5">Description</CWText>
              <CWTextInput
                placeholder="Enter community description"
                value={generatedCommunityIdea.community.description}
                onInput={(e) =>
                  handleFieldUpdate('description', e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <CWText type="h5">Community Image</CWText>
              <CWImageInput
                imageURL={generatedCommunityIdea.community.imageURL}
                onImageUploaded={handleImageChange}
                onImageProcessingChange={handleProcessingChange}
                imageBehavior={ImageBehavior.Circle}
                withAIImageGeneration
              />
            </div>
          </div>

          <CWBanner
            type="info"
            body="Creating a community will automatically generate discussion topics and initial threads."
          />

          <div className="cta-elements">
            <PageCounter
              className="mr-auto"
              activePage={activeCommunityIdeaIndex + 1}
              totalPages={
                communityIdeas.length === 0
                  ? 1
                  : Math.max(
                      communityIdeas.length,
                      activeCommunityIdeaIndex + 1,
                    )
              }
              onPageChange={(index) => setActiveCommunityIdeaIndex(index - 1)}
              disabled={isProcessingImage || isCreatingCommunity}
            />

            {isMaxCommunityIdeaLimitReached ? (
              <CWTooltip
                placement="bottom"
                content={`You can only generate a max of 3 community ideas.`}
                renderTrigger={(handleInteraction) => (
                  <div
                    onMouseEnter={handleInteraction}
                    onMouseLeave={handleInteraction}
                  >
                    <CWButton
                      iconLeft="brain"
                      label="Randomize"
                      containerClassName="ml-auto"
                      type="button"
                      disabled={
                        isProcessingImage ||
                        isCreatingCommunity ||
                        isMaxCommunityIdeaLimitReached
                      }
                      onClick={() =>
                        generateIdea(userPrompt).catch(console.error)
                      }
                    />
                  </div>
                )}
              />
            ) : (
              <CWButton
                iconLeft="brain"
                label="Randomize"
                containerClassName="ml-auto"
                type="button"
                disabled={isProcessingImage || isCreatingCommunity}
                onClick={() => generateIdea(userPrompt).catch(console.error)}
              />
            )}

            <CWButton
              label="Create Community"
              buttonHeight="med"
              buttonWidth="wide"
              onClick={handleSubmit}
              disabled={
                isProcessingImage ||
                isCreatingCommunity ||
                !generatedCommunityIdea?.community?.name ||
                !generatedCommunityIdea?.community?.imageURL
              }
            />
          </div>
        </div>
      )}

      {onCancel && (
        <CWButton
          label="Cancel"
          buttonHeight="sm"
          buttonType="tertiary"
          onClick={onCancel}
          containerClassName="cancel-button"
        />
      )}
    </div>
  );
};
