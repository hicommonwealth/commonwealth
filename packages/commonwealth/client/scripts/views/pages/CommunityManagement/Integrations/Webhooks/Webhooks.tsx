import { WebhookCategory } from '@hicommonwealth/core';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { pluralizeWithoutNumberPrefix } from 'helpers';
import getLinkType from 'helpers/linkType';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import Webhook from 'models/Webhook';
import React, { useState } from 'react';
import app from 'state';
import {
  useCreateWebhookMutation,
  useDeleteWebhookMutation,
  useEditWebhookMutation,
  useFetchWebhooksQuery,
} from 'state/api/webhooks';
import { LinksArray, useLinksArray } from 'views/components/LinksArray';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { WebhookSettingsModal } from 'views/modals/webhook_settings_modal';
import { linkValidationSchema } from '../common/validation';
import './Webhooks.scss';

const Webhooks = () => {
  const community = app.config.chains.getById(app.activeChainId());
  const [hasExistingWebhooks, setHasExistingWebhooks] = useState(false);
  const [webhookToConfigure, setWebhookToConfigure] = useState<Webhook | null>(
    null,
  );
  const {
    links: webhooks,
    setLinks,
    onLinkAdd,
    onLinkRemovedAtIndex,
    onLinkUpdatedAtIndex,
    areLinksValid,
  } = useLinksArray({
    initialLinks: [],
    linkValidation: linkValidationSchema,
  });

  const { mutateAsync: createWebhook, isLoading: isCreatingWebhook } =
    useCreateWebhookMutation();

  const { data: existingWebhooks, isLoading: isLoadingWebhooks } =
    useFetchWebhooksQuery({
      communityId: community.id,
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
            communityId: community.id,
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
          communityId: community.id,
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
    webhook: Webhook,
    categories: WebhookCategory[],
  ) => {
    if (isEditingWebhook) return;

    try {
      await editWebhook({
        communityId: community.id,
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
                webhook.canConfigure && getLinkType(webhook.value) ? (
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
            disabled={webhooks.length === existingWebhooks.length}
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
