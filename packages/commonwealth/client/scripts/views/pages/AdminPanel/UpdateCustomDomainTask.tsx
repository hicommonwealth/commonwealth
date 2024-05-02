import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import app from 'state';
import { CWText } from 'views/components/component_kit/cw_text';
import { ValidationStatus } from 'views/components/component_kit/cw_validation_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { updateCommunityCustomDomain } from 'views/pages/AdminPanel/utils';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { openConfirmation } from '../../modals/confirmation_modal';

const UpdateCustomDomainTask = () => {
  const [communityId, setCommunityId] = useState<string>('');
  const [communityIdValidated, setCommunityIdValidated] =
    useState<boolean>(false);
  const [customDomain, setCustomDomain] = useState<string>('');
  const [customDomainValidated, setCustomDomainValidated] =
    useState<boolean>(false);
  const [dnsTarget, setDnsTarget] = useState<string>('');

  const openConfirmationModal = () => {
    openConfirmation({
      title: 'Update Custom Domain',
      // eslint-disable-next-line max-len
      description: `Are you sure you want to update ${communityId}'s custom domain to ${customDomain}? Please ensure engineering has been contacted prior to making this change.`,
      buttons: [
        {
          label: 'Update',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: () => {
            void (async () => {
              try {
                const dns_target = await updateCommunityCustomDomain({
                  community_id: communityId,
                  custom_domain: customDomain,
                });
                if (dns_target) {
                  // TODO: display this to the admin to report to community
                  setDnsTarget(dns_target);
                }
                setCommunityId('');
                setCustomDomain('');
                notifySuccess('Custom domain updated');
              } catch (e) {
                notifyError('Error updating custom domain');
                console.error(e);
              }
            })();
          },
        },
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  const validateCommunityFn = (
    value: string,
  ): [ValidationStatus, string] | [] => {
    const communityExists = app.config.chains.getById(value);
    if (!communityExists) {
      setCommunityIdValidated(false);
      return ['failure', 'Community not found'];
    }
    setCommunityIdValidated(true);
    return [];
  };

  const validateCustomDomain = (
    value: string,
  ): [ValidationStatus, string] | [] => {
    const validCustomDomainUrl = new RegExp(
      '^(([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}$',
    );
    // TODO: enhance this validation to ensure a tighter format (no dangling paths)
    if (!validCustomDomainUrl.test(value)) {
      setCustomDomainValidated(false);
      return ['failure', 'Invalid URL (try removing the http prefix)'];
    }

    // there's probably a better way to remove prefixes for duplicate finding purposes
    const existingCustomDomain = app.config.chains
      .getAll()
      .find(
        (community) =>
          community.customDomain &&
          community.customDomain
            .replace('https://', '')
            .replace('http://', '') === value,
      );
    if (existingCustomDomain) {
      setCustomDomainValidated(false);
      return [
        'failure',
        `Custom domain in use by community '${existingCustomDomain.id}'`,
      ];
    }
    setCustomDomainValidated(true);
    return [];
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Update Custom Domain</CWText>
      <CWText type="caption">
        Update a communities custom domain url. Contact engineering before
        changing, and for custom domain removals.
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          value={communityId}
          label="Community Id"
          onInput={(e) => {
            setCommunityId(e.target.value);
            if (e.target.value.length === 0) setCommunityIdValidated(false);
          }}
          inputValidationFn={(value) => validateCommunityFn(value)}
          placeholder="dydx"
        />
        <CWTextInput
          value={customDomain}
          label="Custom Domain URL"
          onInput={(e) => {
            setCustomDomain(e.target.value);
            if (e.target.value.length === 0) setCustomDomainValidated(false);
          }}
          inputValidationFn={(value) => validateCustomDomain(value)}
          placeholder="my.customdomain.com"
        />
        <CWButton
          label="Update"
          className="TaskButton"
          disabled={!customDomainValidated || !communityIdValidated}
          onClick={openConfirmationModal}
        />
      </div>
    </div>
  );
};

export default UpdateCustomDomainTask;
