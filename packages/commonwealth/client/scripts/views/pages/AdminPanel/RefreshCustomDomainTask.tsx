import React, { useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { notifyError } from '../../../controllers/app/notifications';
import useRefreshCustomDomainQuery from '../../../state/api/communities/refreshCustomDomain';
import { CWTextInput } from '../../components/component_kit/cw_text_input';

const RefreshCustomDomainTask = () => {
  const [customDomain, setCustomDomain] = useState<string>('');

  const { data, refetch } = useRefreshCustomDomainQuery({
    custom_domain: customDomain,
    enabled: false,
  });

  return (
    <div className="TaskGroup">
      <CWText type="h4">Refresh Custom Domain</CWText>
      <CWText type="caption">
        Refresh a custom domain, this must be done after the customer has added
        it to their DNS. This route will also provide information about the
        domain, including whether it is active or inactive. Ensure the customer
        is given the CNAME for their DNS target.
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          value={customDomain}
          label="Custom Domain URL"
          onInput={(e) => {
            setCustomDomain(e.target.value);
          }}
          placeholder="my.customdomain.com"
        />
        <CWButton
          label="Refresh"
          className="TaskButton"
          disabled={!customDomain}
          onClick={() =>
            refetch({ throwOnError: true }).catch((e) => notifyError(e.message))
          }
        />
      </div>
      {data && JSON.stringify(data)}
    </div>
  );
};

export default RefreshCustomDomainTask;
