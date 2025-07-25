import { ChainBase, DefaultPage } from '@hicommonwealth/shared';
import { useFlag } from 'client/scripts/hooks/useFlag';
import clsx from 'clsx';
import { notifyError } from 'controllers/app/notifications';
import { isS3URL } from 'helpers/awsHelpers';
import useBeforeUnload from 'hooks/useBeforeUnload';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import React, { useRef, useState } from 'react';
import { slugifyPreserveDashes } from 'shared/utils';
import { useUpdateCommunityMutation } from 'state/api/communities';
import useCreateCommunityMutation, {
  buildCreateCommunityInput,
} from 'state/api/communities/createCommunity';
import { generateImage } from 'state/api/general/generateImage';
import {
  useEstimateGasQuery,
  useLaunchTokenMutation,
} from 'state/api/launchPad';
import { useCreateTokenMutation } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import PageCounter from 'views/components/PageCounter';
import { ImageProcessed } from 'views/components/component_kit/CWImageInput';
import { CWText } from 'views/components/component_kit/cw_text';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import TokenLaunchButton from 'views/components/sidebar/TokenLaunchButton';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { fromWei } from 'web3-utils';
import useCreateTokenCommunity from '../useCreateTokenCommunity';
import './QuickTokenLaunchForm.scss';
import SuccessStep from './steps/SuccessStep';
import TokenInformationFormStep from './steps/TokenInformationFormStep';
import { FormSubmitValues } from './steps/TokenInformationFormStep/types';
import { useGenerateTokenIdea } from './useGenerateTokenIdea';
import { generateCommunityNameFromToken } from './utils';

type QuickTokenLaunchFormProps = {
  onCancel: () => void;
  onCommunityCreated: (communityId: string) => void;
  initialIdeaPrompt?: string;
  generateIdeaOnMount?: boolean;
  isSmallScreen?: boolean;
};

const MAX_IDEAS_LIMIT = 5;

const RATE_LIMIT_MESSAGE =
  'You are being rate limited. Please wait and try again.';

interface RateLimitErrorType {
  data?: {
    httpStatus?: number;
    message?: string;
  };
  status?: number;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const isRateLimitError = (err: RateLimitErrorType) => {
  const status = err?.data?.httpStatus || err?.status || err?.response?.status;
  if (status === 429) return true;

  if (status === 401) {
    const msg =
      err?.data?.message || err?.message || err?.response?.data?.message || '';
    const lowerMsg = String(msg).toLowerCase();
    return (
      lowerMsg.includes('image') &&
      lowerMsg.includes('prompt') &&
      lowerMsg.includes('overload')
    );
  }

  return false;
};

export const QuickTokenLaunchForm = ({
  onCancel,
  onCommunityCreated,
  initialIdeaPrompt,
  generateIdeaOnMount = false,
  isSmallScreen = false,
}: QuickTokenLaunchFormProps) => {
  const tokenizedThreadsEnabled = useFlag('tokenizedThreads');
  const [transactionHash, setTransactionHash] = useState('');

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const {
    generateIdea,
    tokenIdeas,
    activeTokenIdeaIndex,
    generatedTokenIdea,
    isMaxTokenIdeaLimitReached,
    setActiveTokenIdeaIndex,
    updateTokenIdeaByIndex,
  } = useGenerateTokenIdea({
    maxIdeasLimit: MAX_IDEAS_LIMIT,
  });
  const [isCreatingQuickToken, setIsCreatingQuickToken] = useState(false);
  const [
    createdCommunityIdsToTokenInfoMap,
    setCreatedCommunityIdsToTokenInfoMap,
  ] = useState({});
  const [processedImagesPerIdea, setProcessedImagesPerIdea] = useState<
    {
      ideaIndex: number;
      imagesProcessed: ImageProcessed[];
    }[]
  >([]);

  useRunOnceOnCondition({
    callback: () => {
      generateIdea(initialIdeaPrompt).catch(console.error);
    },
    shouldRun: generateIdeaOnMount,
  });

  const {
    selectedAddress,
    setSelectedAddress,
    baseNode,
    createdCommunityId,
    setCreatedCommunityId,
  } = useCreateTokenCommunity();

  const { mutateAsync: launchToken } = useLaunchTokenMutation();
  const { data: estimatedPrice } = useEstimateGasQuery({
    chainRpc: baseNode?.url || '',
    ethChainId: baseNode?.ethChainId || 0,
    apiEnabled: !!(baseNode?.url && baseNode?.ethChainId),
  });
  const ethFee = estimatedPrice
    ? fromWei(estimatedPrice.toString(), 'ether')
    : null;

  const { mutateAsync: createToken } = useCreateTokenMutation();

  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation({
    communityId: createdCommunityId || '', // this will exist by the time update community is called
  });

  const user = useUserStore();

  const { mutateAsync: createCommunityMutation } = useCreateCommunityMutation();

  useBeforeUnload(isCreatingQuickToken);

  const triggerDiscardExtraTokenDraftsConfirmation = (
    onConfirm: () => void,
  ) => {
    openConfirmation({
      title: `Proceed with active token form?`,
      description: (
        <CWText>
          You currently have {tokenIdeas.length} token form drafts. Only the
          active form will be used to create the token and the other drafts will
          be discarded.
        </CWText>
      ),
      buttons: [
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
        {
          label: 'Proceed',
          buttonType: 'primary',
          buttonHeight: 'sm',
          onClick: onConfirm,
        },
      ],
    });
  };

  const handleTokenLaunch = (tokenInfo: FormSubmitValues) => {
    if (isCreatingQuickToken) return;

    const handleAsync = async () => {
      setIsCreatingQuickToken(true);

      try {
        // this check will never be triggered, addding to avoid ts issues
        if (!baseNode || !baseNode.ethChainId) {
          notifyError('Could not find base chain node');
          return;
        }

        // this check will never be triggered, addding to avoid ts issues
        if (!selectedAddress?.address) {
          notifyError('Could not find selected address');
          return;
        }

        const sanitizedTokenInfo = {
          name: tokenInfo.name.trim(),
          symbol: tokenInfo.symbol.trim(),
          description: tokenInfo.description.trim() || '',
          imageURL: tokenInfo.imageURL.trim() || '',
        };

        // 1. check if this same token info was submitted before and a community per that info was created
        let communityId =
          createdCommunityIdsToTokenInfoMap[
            sanitizedTokenInfo.name + sanitizedTokenInfo.symbol
          ] || '';
        if (!communityId) {
          // 1.1 generate basic community info from `sanitizedTokenInfo`
          const generatedCommunityInfo = {
            communityName: generateCommunityNameFromToken({
              tokenName: sanitizedTokenInfo.name || '',
              tokenSymbol: sanitizedTokenInfo.symbol || '',
            }),
            communityDescription:
              sanitizedTokenInfo.description ||
              `Community for '${sanitizedTokenInfo.name}' token`,
            communityProfileImageURL: sanitizedTokenInfo.imageURL || '',
          };

          // 1.2 image is required for community, generate via OpenAI if not present
          if (!generatedCommunityInfo.communityProfileImageURL) {
            generatedCommunityInfo.communityProfileImageURL =
              await generateImage({
                prompt: `Generate an image for a web3 token named "${
                  sanitizedTokenInfo.name
                }" having a ticker/symbol of "${sanitizedTokenInfo.symbol}"`,
                model: 'runware:100@1',
              });
          }

          // 1.3 create community with communityId, and make `communityId` unique if it already exists
          communityId = slugifyPreserveDashes(
            generatedCommunityInfo.communityName.toLowerCase(),
          );
          while (true) {
            // 1.4 create the community with the specific `selectedAddress` in header
            user.setData({
              // this gets reset after creating community
              addressSelectorSelectedAddress: selectedAddress.address,
            });
            const communityPayload = buildCreateCommunityInput({
              id: communityId,
              name: generatedCommunityInfo.communityName,
              chainBase: ChainBase.Ethereum,
              description: generatedCommunityInfo.communityDescription,
              iconUrl: generatedCommunityInfo.communityProfileImageURL,
              socialLinks: [],
              chainNodeId: baseNode.id,
              tokenizeCommunity: tokenizedThreadsEnabled ? true : false,
            });

            let response;
            try {
              response = await createCommunityMutation(communityPayload);
            } catch (e) {
              if (isRateLimitError(e)) {
                throw e;
              }
              const errorMsg = e?.message?.toLowerCase() || '';
              if (
                errorMsg.includes('name') &&
                errorMsg.includes('already') &&
                errorMsg.includes('exists')
              ) {
                // this is not a unique community name error, abort token creation
                response = 'invalid_state';
              } else {
                throw e;
              }
            }
            if (response === 'invalid_state') {
              notifyError('Community name already taken.');
              return;
            }

            if (response) {
              // store community id for this submitted token info, incase user submits
              // the form again we won't create another community for the same token info
              setCreatedCommunityIdsToTokenInfoMap((prev) => ({
                ...prev,
                [sanitizedTokenInfo.name + sanitizedTokenInfo.symbol]:
                  communityId,
              }));

              break;
            }

            // Note: we just add 1's until `communityId` is unique.
            // better algo could be used but this case would be rare.
            generatedCommunityInfo.communityName += `1`;
            communityId = slugifyPreserveDashes(
              generatedCommunityInfo.communityName.toLowerCase(),
            );
          }
        }

        // 2. attempt Launch token on chain
        const txReceipt = await launchToken({
          chainRpc: baseNode.url,
          ethChainId: baseNode.ethChainId,
          name: sanitizedTokenInfo.name,
          symbol: sanitizedTokenInfo.symbol,
          walletAddress: selectedAddress.address,
        });

        // 3. store `tokenInfo` on db
        user.setData({
          // this gets reset after creating token on api
          addressSelectorSelectedAddress: selectedAddress.address,
        });

        setTransactionHash(txReceipt.transactionHash);

        const token = await createToken({
          community_id: communityId,
          eth_chain_id: baseNode.ethChainId!,
          transaction_hash: txReceipt.transactionHash,
          description: sanitizedTokenInfo.description,
          icon_url: sanitizedTokenInfo.imageURL,
        });

        // 4. update community to reference the created token
        user.setData({
          // this gets reset after updating community
          addressSelectorSelectedAddress: selectedAddress.address,
        });
        await updateCommunity({
          community_id: communityId,
          namespace: token.namespace,
          transactionHash: txReceipt.transactionHash,
          token_name: sanitizedTokenInfo.name,
          ...(sanitizedTokenInfo.description && {
            description: sanitizedTokenInfo.description,
          }),
          ...(sanitizedTokenInfo.imageURL && {
            icon_url: sanitizedTokenInfo.imageURL,
          }),
          default_page: DefaultPage.Homepage,
          launchpad_weighted_voting: true,
        }).catch(() => undefined); // failure of this call shouldn't break this handler

        setCreatedCommunityId(communityId);
        onCommunityCreated(communityId);
      } catch (e) {
        console.error(`Error creating token: `, e, e.name);

        if (isRateLimitError(e)) {
          notifyError(RATE_LIMIT_MESSAGE);
        } else if (e?.name === 'TransactionBlockTimeoutError') {
          notifyError('Transaction not timely signed. Please try again!');
        } else if (
          e?.message
            ?.toLowerCase()
            .includes('user denied transaction signature')
        ) {
          notifyError('Transaction rejected!');
        } else if (
          e?.data?.message?.toLowerCase().includes('insufficient funds')
        ) {
          notifyError('Insufficient funds to launch token!');
        } else {
          notifyError('Failed to create token!');
        }
      } finally {
        setIsCreatingQuickToken(false);
      }
    };

    handleAsync().catch(console.error);
  };

  const handleSubmit = (tokenInfo: FormSubmitValues) => {
    if (tokenIdeas.length > 1) {
      // if there are multiple drafts, then confirm from user if they want to proceed with
      // active draft and discard the others
      triggerDiscardExtraTokenDraftsConfirmation(() =>
        handleTokenLaunch(tokenInfo),
      );
    } else {
      handleTokenLaunch(tokenInfo);
    }
  };

  const handleFormUpdates = (values: FormSubmitValues) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const timeout = setTimeout(() => {
      const isSameValues =
        values.name === generatedTokenIdea?.token?.name &&
        values.symbol === generatedTokenIdea?.token?.symbol &&
        values.description === generatedTokenIdea?.token?.description &&
        values.imageURL === generatedTokenIdea?.token?.imageURL;
      if (generatedTokenIdea?.isChunking || isSameValues) {
        timeoutRef.current = undefined;
        return;
      }

      updateTokenIdeaByIndex(
        {
          description: values.description,
          imageURL: values.imageURL,
          name: values.name,
          symbol: values.symbol,
        },
        activeTokenIdeaIndex,
      );

      timeoutRef.current = undefined;
    }, 1000);
    timeoutRef.current = timeout;
  };

  const handleProcessedImagesListChange = (
    processedImages: ImageProcessed[],
  ) => {
    setProcessedImagesPerIdea((ideas) => {
      const temp = [...ideas];

      const activeIdeaImages = temp.find(
        (i) => i.ideaIndex === activeTokenIdeaIndex,
      );

      if (activeIdeaImages) {
        // update existing record and remove non-s3 url if present, that one came from
        // chunk 4 (non s3 url) of token generation response and is not the url we
        // want to use for api payload
        const shouldRemove0IndexURL =
          processedImages.length === 2 &&
          isS3URL(processedImages.at(-1)?.url || '') &&
          !isS3URL(processedImages.at(-2)?.url || '');
        const newProcessedImages = shouldRemove0IndexURL
          ? [{ ...processedImages[1] }]
          : processedImages;
        activeIdeaImages.imagesProcessed = [...newProcessedImages];
      } else {
        // add new record
        temp.push({
          ideaIndex: activeTokenIdeaIndex,
          imagesProcessed: [...processedImages],
        });
      }

      return temp;
    });
  };

  return (
    <div className="QuickTokenLaunchForm">
      {!createdCommunityId && (
        <CWText type="h3">
          {isCreatingQuickToken ? 'Launching your idea' : 'Launch an idea'}
        </CWText>
      )}

      {isCreatingQuickToken && <CWCircleMultiplySpinner />}

      {createdCommunityId ? (
        <SuccessStep communityId={createdCommunityId} withToken />
      ) : (
        <TokenInformationFormStep
          key={activeTokenIdeaIndex}
          selectedAddress={selectedAddress}
          onAddressSelected={setSelectedAddress}
          openAddressSelectorOnMount={false}
          formDisabled={generatedTokenIdea?.isChunking}
          onCancel={onCancel}
          onFormUpdate={handleFormUpdates}
          onSubmit={handleSubmit}
          {...(generatedTokenIdea?.chunkingField && {
            focusField: generatedTokenIdea.chunkingField,
          })}
          forceFormValues={{
            ...generatedTokenIdea?.token,
            description:
              initialIdeaPrompt || generatedTokenIdea?.token?.description || '',
          }}
          containerClassName={clsx('shortened-token-information-form', {
            'display-none': isCreatingQuickToken,
          })}
          imageControlProps={{
            loading:
              generatedTokenIdea?.isChunking &&
              !generatedTokenIdea?.chunkingField &&
              !generatedTokenIdea?.token?.imageURL,
            canSwitchBetweenProcessedImages: true,
            onProcessedImagesListChange: handleProcessedImagesListChange,
            processedImages:
              processedImagesPerIdea.find(
                (pi) => pi.ideaIndex === activeTokenIdeaIndex,
              )?.imagesProcessed || undefined,
          }}
          customFooter={({ isProcessingProfileImage }) => (
            <>
              <CWBanner
                type="info"
                body={`Launching token will create a complimentary community.
                      You can edit your community post launch.`}
              />
              <CWBanner
                type="info"
                body={`Launching your token on BASE requires a small amount of BASE ETH to cover gas fees.
                      ${ethFee ? `Estimated fee: ${ethFee} BASE ETH.` : ''}`}
              />
              <div className="cta-elements">
                {/* allows to switch b/w generated ideas */}
                <PageCounter
                  className="mr-auto"
                  activePage={activeTokenIdeaIndex + 1}
                  totalPages={
                    tokenIdeas.length == 0
                      ? 1
                      : Math.max(tokenIdeas.length, activeTokenIdeaIndex + 1)
                  }
                  onPageChange={(index) => setActiveTokenIdeaIndex(index - 1)}
                  disabled={isProcessingProfileImage || isCreatingQuickToken}
                />

                {isMaxTokenIdeaLimitReached ? (
                  <CWTooltip
                    placement="bottom"
                    content={`You can only generate a max of ${MAX_IDEAS_LIMIT} ideas.`}
                    renderTrigger={(handleInteraction) => (
                      <div
                        onMouseEnter={handleInteraction}
                        onMouseLeave={handleInteraction}
                      >
                        <CWButton
                          iconLeft="brain"
                          label={isSmallScreen ? 'Random' : 'Randomize'}
                          containerClassName="ml-auto"
                          type="button"
                          disabled={
                            isProcessingProfileImage ||
                            isCreatingQuickToken ||
                            isMaxTokenIdeaLimitReached
                          }
                          onClick={() => {
                            generateIdea().catch(console.error);
                          }}
                        />
                      </div>
                    )}
                  />
                ) : (
                  <CWButton
                    iconLeft="brain"
                    label={isSmallScreen ? 'Random' : 'Randomize'}
                    containerClassName="ml-auto"
                    type="button"
                    disabled={
                      isProcessingProfileImage ||
                      isCreatingQuickToken ||
                      isMaxTokenIdeaLimitReached
                    }
                    onClick={() => {
                      generateIdea().catch(console.error);
                    }}
                  />
                )}

                <TokenLaunchButton
                  buttonWidth="narrow"
                  buttonType="submit"
                  buttonLabel={isSmallScreen ? 'Launch' : 'Launch Token'}
                  disabled={
                    isProcessingProfileImage ||
                    isCreatingQuickToken ||
                    generatedTokenIdea?.isChunking
                  }
                />
              </div>
            </>
          )}
        />
      )}

      {!!transactionHash && (
        <>
          <CWText type="b1" className="debugTxHash debugTxHashGap">
            Transaction hash is
          </CWText>
          <CWText type="b1" className="debugTxHash">
            {transactionHash}
          </CWText>
        </>
      )}
    </div>
  );
};
