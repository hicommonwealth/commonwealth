import { Webhook, WebhookSupportedEvents } from '@hicommonwealth/schemas';
import { getWebhookDestination } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { pluralizeWithoutNumberPrefix } from 'helpers';
import { linkValidationSchema } from 'helpers/formValidations/common';
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
import { Link, LinksArray, useLinksArray } from 'views/components/LinksArray';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { WebhookSettingsModal } from 'views/modals/webhook_settings_modal';
import z from 'zod';
import './Webhooks.scss';

const Webhooks = () => {
  const communityId = app.activeChainId() || '';
  const [hasExistingWebhooks, setHasExistingWebhooks] = useState(false);
  const [webhookToConfigure, setWebhookToConfigure] = useState<z.infer<
    typeof Webhook
  > | null>(null);
  const {
    links,
    setLinks,
    onLinkAdd,
    onLinkRemovedAtIndex,
    onLinkUpdatedAtIndex,
    areLinksValid,
  } = useLinksArray({
    initialLinks: [],
    linkValidation: linkValidationSchema.required,
  });

  const webhooks = links as (Link & { metadata: z.infer<typeof Webhook> })[];

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
    if (!webhooksToCreate.length) return;
    try {
      await Promise.all(
        webhooksToCreate.map(async (webhook) => {
          await createWebhook({
            community_id: communityId,
            webhookUrl: webhook.value.trim(),
          });
        }),
      );
      setLinks(
        [...webhooks].map((webhook) => ({ ...webhook, canConfigure: true })),
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
          id: webhooks[index].metadata.id,
          community_id: communityId,
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
    events: Array<z.infer<typeof WebhookSupportedEvents>>,
  ) => {
    if (isEditingWebhook) return;

    try {
      await editWebhook({
        id: webhook.id!,
        community_id: communityId,
        events: events,
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
                webhook.canConfigure &&
                webhook?.metadata?.destination &&
                getWebhookDestination(webhook.metadata?.url) !== 'unknown' ? (
                  <CWTag
                    label={webhook.metadata.destination}
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
              setWebhookToConfigure(webhooks[index].metadata)
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
            webhook={webhookToConfigure!}
          />
        }
        onClose={() => setWebhookToConfigure(null)}
        open={!!webhookToConfigure}
      />
    </>
  );
};

export default Webhooks;
