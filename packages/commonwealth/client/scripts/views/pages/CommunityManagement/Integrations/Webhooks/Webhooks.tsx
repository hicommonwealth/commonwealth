import { Webhook } from '@hicommonwealth/schemas';
import { WebhookCategory } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { pluralizeWithoutNumberPrefix } from 'helpers';
import { linkValidationSchema } from 'helpers/formValidations/common';
import { getLinkType, isLinkValid } from 'helpers/link';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import React, { useState } from 'react';
import app from 'state';
import {
  useCreateWebhookMutation,
  useDeleteWebhookMutation,
  useEditWebhookMutation,
  useFetchWebhooksQuery,
} from 'state/api/webhooks';
import _ from 'underscore';
import { LinksArray, useLinksArray } from 'views/components/LinksArray';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { WebhookSettingsModal } from 'views/modals/webhook_settings_modal';
import z from 'zod';
import './Webhooks.scss';

const Webhooks = () => {
  const communityId = app.activeChainId();
  const [hasExistingWebhooks, setHasExistingWebhooks] = useState(false);
  const [webhookToConfigure, setWebhookToConfigure] = useState<z.infer<
    typeof Webhook
  > | null>(null);
  const {
    links: webhooks,
    setLinks,
    onLinkAdd,
    onLinkRemovedAtIndex,
    onLinkUpdatedAtIndex,
    areLinksValid,
  } = useLinksArray({
    initialLinks: [],
    linkValidation: linkValidationSchema.required,
  });

  const { mutateAsync: createWebhook, isLoading: isCreatingWebhook } =
    useCreateWebhookMutation();

  const { data: existingWebhooks, isLoading: isLoadingWebhooks } =
    useFetchWebhooksQuery({
      communityId: communityId,
    });

  const { mutateAsync: deleteWebhook, isLoading: isDeletingWebhook } =
    useDeleteWebhookMutation();

  const { mutateAsync: editWebhook, isLoading: isEditingWebhook } =
    useEditWebhookMutation();

  useNecessaryEffect(() => {
    if (!isLoadingWebhooks && existingWebhooks) {
      const currentWebhooks = ([...existingWebhooks] || []).map((hookData) => ({
        value: hookData.url,
        canDelete: true,
        canConfigure: true,
        canUpdate: false,
        error: '',
        metadata: hookData, // Storing existing webhook data here
      }));
      currentWebhooks.sort((a, b) => a.value.localeCompare(b.value));
      setLinks(currentWebhooks);
      setHasExistingWebhooks(existingWebhooks.length > 0);
    }
  }, [existingWebhooks, isLoadingWebhooks]);

  const onSaveChanges = async () => {
    if (!areLinksValid() || isCreatingWebhook) return;

    const webhooksToCreate = webhooks.filter(
      (webhook) => !webhook.canConfigure,
    );
    try {
      await Promise.all(
        webhooksToCreate.map(async (webhook) => {
          await createWebhook({
            id: communityId,
            webhookUrl: webhook.value.trim(),
          });
        }),
      );

      notifySuccess(
        `${pluralizeWithoutNumberPrefix(
          webhooksToCreate.length,
          'Webhook',
        )} created!`,
      );
    } catch {
      notifyError(
        `Failed to create ${pluralizeWithoutNumberPrefix(
          webhooksToCreate.length,
          'webhook',
        )}!`,
      );
    } finally {
      setLinks(
        [...webhooks].map((webhook) => ({ ...webhook, canConfigure: true })),
      );
    }
  };

  const handleLinkRemoval = async (index) => {
    if (isDeletingWebhook) return;

    try {
      if (
        webhooks[index].value &&
        !webhooks[index].error &&
        webhooks[index].canConfigure
      ) {
        await deleteWebhook({
          community_id: communityId,
          webhookUrl: webhooks[index].value,
        });
        notifySuccess('Webhook deleted!');
      }
    } catch {
      notifyError('Failed to delete webhook!');
    } finally {
      onLinkRemovedAtIndex(index);
    }
  };

  const handleUpdateWebhook = async (
    webhook: z.infer<typeof Webhook>,
    categories: WebhookCategory[],
  ) => {
    if (isEditingWebhook) return;

    try {
      await editWebhook({
        communityId: communityId,
        webhookId: webhook.id,
        webhookCategories: categories,
      });
      notifySuccess('Updated webhook config!');
    } catch {
      notifyError('Failed to update webhook config!');
    } finally {
      setWebhookToConfigure(null);
    }
  };

  return (
    <>
      <section className="Webhooks">
        <div className="header">
          <CWText type="h4">Webhooks</CWText>
          <CWText type="b1">
            <p>
              Slack, Discord, and Telegram webhooks are supported. For more
              information and examples for setting these up, please view our{' '}
              <a href="https://docs.commonwealth.im/commonwealth/for-admins-and-mods/capabilities/webhooks">
                documentation
              </a>
              .
            </p>
          </CWText>
        </div>

        {webhooks.length > 0 && (
          <LinksArray
            label="Webhook"
            links={webhooks.map((webhook) => ({
              ...webhook,
              canDelete: !isDeletingWebhook,
              canConfigure: webhook.canConfigure ? !isEditingWebhook : false,
              customElementAfterLink:
                webhook.canConfigure && isLinkValid(webhook.value) ? (
                  <CWTag
                    label={getLinkType(webhook.value)}
                    type="group"
                    classNames="link-type"
                  />
                ) : (
                  ''
                ),
            }))}
            onLinkAdd={onLinkAdd}
            onLinkUpdatedAtIndex={onLinkUpdatedAtIndex}
            onLinkRemovedAtIndex={handleLinkRemoval}
            addLinkButtonCTA="+ Add Webhook"
            onLinkConfiguredAtIndex={(index) =>
              setWebhookToConfigure(webhooks[index].metadata as Webhook)
            }
            canConfigureLinks
          />
        )}

        {hasExistingWebhooks || webhooks.length > 0 ? (
          <CWButton
            buttonType="secondary"
            label="Save Changes"
            disabled={_.isEqual(
              [...(webhooks || []).map((x) => x.value.trim())].sort((a, b) =>
                a.localeCompare(b),
              ),
              [...(existingWebhooks || []).map((x) => x.url.trim())].sort(
                (a, b) => a.localeCompare(b),
              ),
            )}
            onClick={onSaveChanges}
          />
        ) : (
          <CWButton
            buttonType="secondary"
            label="Add Webhook"
            onClick={onLinkAdd}
          />
        )}
      </section>
      <CWModal
        size="small"
        content={
          <WebhookSettingsModal
            onModalClose={() => setWebhookToConfigure(null)}
            updateWebhook={handleUpdateWebhook}
            // @ts-expect-error <StrictNullChecks/>
            webhook={webhookToConfigure}
          />
        }
        onClose={() => setWebhookToConfigure(null)}
        open={!!webhookToConfigure}
      />
    </>
  );
};

export default Webhooks;
