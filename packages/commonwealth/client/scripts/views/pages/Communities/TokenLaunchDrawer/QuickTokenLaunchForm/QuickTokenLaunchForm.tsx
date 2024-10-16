import { ChainBase, commonProtocol } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { notifyError } from 'controllers/app/notifications';
import useBeforeUnload from 'hooks/useBeforeUnload';
import React, { useState } from 'react';
import { slugifyPreserveDashes } from 'shared/utils';
import { useUpdateCommunityMutation } from 'state/api/communities';
import useCreateCommunityMutation, {
  buildCreateCommunityInput,
} from 'state/api/communities/createCommunity';
import { generateImage } from 'state/api/general/generateImage';
import { useLaunchTokenMutation } from 'state/api/launchPad';
import { useCreateTokenMutation } from 'state/api/token';
import useUserStore from 'state/ui/user';
import PageCounter from 'views/components/PageCounter';
import { CWText } from 'views/components/component_kit/cw_text';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import TokenLaunchButton from 'views/components/sidebar/TokenLaunchButton';
import { generateCommunityNameFromToken } from '../../../LaunchToken/steps/CommunityInformationStep/utils';
import SuccessStep from '../../../LaunchToken/steps/SuccessStep';
import TokenInformationForm from '../../../LaunchToken/steps/TokenInformationStep/TokenInformationForm';
import { FormSubmitValues } from '../../../LaunchToken/steps/TokenInformationStep/TokenInformationForm/types';
import useCreateTokenCommunity from '../../../LaunchToken/useCreateTokenCommunity';
import './QuickTokenLaunchForm.scss';

type QuickTokenLaunchFormProps = {
  onCancel: () => void;
  onCommunityCreated: (communityId: string) => void;
};

export const QuickTokenLaunchForm = ({
  onCancel,
  onCommunityCreated,
}: QuickTokenLaunchFormProps) => {
  const [randomizeAttempts] = useState<{ data: Object }[]>([]);
  const [isCreatingQuickToken, setIsCreatingQuickToken] = useState(false);
  const [
    createdCommunityIdsToTokenInfoMap,
    setCreatedCommunityIdsToTokenInfoMap,
  ] = useState({});

  const {
    selectedAddress,
    setSelectedAddress,
    baseNode,
    createdCommunityId,
    setCreatedCommunityId,
  } = useCreateTokenCommunity();

  const { mutateAsync: launchToken } = useLaunchTokenMutation();

  const { mutateAsync: createToken } = useCreateTokenMutation();

  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation({
    communityId: createdCommunityId || '', // this will exist by the time update community is called
  });

  const user = useUserStore();

  const { mutateAsync: createCommunityMutation } = useCreateCommunityMutation();

  useBeforeUnload(isCreatingQuickToken);

  const handleSubmit = (tokenInfo: FormSubmitValues) => {
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
          name: tokenInfo.tokenName.trim(),
          symbol: tokenInfo.tokenTicker.trim(),
          description: tokenInfo.tokenDescription.trim() || '',
          imageURL: tokenInfo.tokenImageURL.trim() || '',
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
            });
            const response = await createCommunityMutation(communityPayload)
              .then(() => true)
              .catch((e) => {
                const errorMsg = e?.message?.toLowerCase() || '';
                if (
                  !(
                    errorMsg.includes('name') &&
                    errorMsg.includes('already') &&
                    errorMsg.includes('exists')
                  )
                ) {
                  // this is not a unique community name error, abort token creation
                  return 'invalid_state';
                }
                return false;
              });

            if (response === 'invalid_state') return;

            if (response === true) {
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
        await launchToken({
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
        await createToken({
          base: ChainBase.Ethereum,
          chain_node_id: baseNode.id,
          name: sanitizedTokenInfo.name,
          symbol: sanitizedTokenInfo.symbol,
          icon_url: sanitizedTokenInfo.imageURL,
          description: sanitizedTokenInfo.description,
          community_id: communityId,
          launchpad_contract_address:
            // this will always exist, adding 0 to avoid typescript issues
            commonProtocol.factoryContracts[baseNode.ethChainId].launchpad,
        });

        // 4. update community to reference the created token
        user.setData({
          // this gets reset after updating community
          addressSelectorSelectedAddress: selectedAddress.address,
        });
        await updateCommunity({
          id: communityId,
          token_name: sanitizedTokenInfo.name,
          ...(sanitizedTokenInfo.description && {
            description: sanitizedTokenInfo.description,
          }),
          ...(sanitizedTokenInfo.imageURL && {
            icon_url: sanitizedTokenInfo.imageURL,
          }),
        }).catch(() => undefined); // failure of this call shouldn't break this handler

        setCreatedCommunityId(communityId);
        onCommunityCreated(communityId);
      } catch (e) {
        console.error(`Error creating token: `, e, e.name);

        if (e?.name === 'TransactionBlockTimeoutError') {
          notifyError('Transaction not timely signed. Please try again!');
        } else if (
          e?.message
            ?.toLowerCase()
            .includes('user denied transaction signature')
        ) {
          notifyError('Transaction rejected!');
        } else {
          notifyError('Failed to create token!');
        }
      } finally {
        setIsCreatingQuickToken(false);
      }
    };

    handleAsync().catch(console.error);
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
        <TokenInformationForm
          selectedAddress={selectedAddress}
          onAddressSelected={setSelectedAddress}
          onCancel={onCancel}
          onSubmit={handleSubmit}
          containerClassName={clsx('shortened-token-information-form', {
            'display-none': isCreatingQuickToken,
          })}
          customFooter={({ isProcessingProfileImage }) => (
            <>
              <CWBanner
                type="info"
                body={`Launching token will create a complimentary community. 
                        You can edit your community post launch.`}
              />
              <div className="cta-elements">
                {/* TODO: https://github.com/hicommonwealth/commonwealth/issues/8863 */}
                <PageCounter
                  activePage={randomizeAttempts.length + 2}
                  totalPages={randomizeAttempts.length + 3}
                  onPageChange={() => {}}
                />

                {/* TODO: https://github.com/hicommonwealth/commonwealth/issues/8863 */}
                <CWButton
                  iconLeft="brain"
                  label="Randomize"
                  containerClassName="ml-auto"
                  disabled={isProcessingProfileImage || isCreatingQuickToken}
                />

                <TokenLaunchButton
                  buttonWidth="wide"
                  buttonType="submit"
                  disabled={isProcessingProfileImage || isCreatingQuickToken}
                />
              </div>
            </>
          )}
        />
      )}
    </div>
  );
};
