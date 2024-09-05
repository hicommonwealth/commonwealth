import React, { useState } from 'react';
import useRefreshCustomDomainQuery from 'state/api/communities/refreshCustomDomain';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { notifyError } from '../../../controllers/app/notifications';
import { CWTextInput } from '../../components/component_kit/cw_text_input';

type UseRefreshCustomDomainQueryResponse = {
  hostname: string;
  cname: string;
  cert_status: string;
  status: string;
};

const parseResponse = (data: UseRefreshCustomDomainQueryResponse) => {
  return (
    <>
      <CWText>
        The CNAME is &quot;{data.cname}&quot;. Give this to the customer to
        allow them to set up the custom domain
      </CWText>
      {data.cert_status === 'failing' && (
        <CWText>
          Cert status is failing, this means that the customer has not yet set
          up the custom domain (Added the CNAME).
        </CWText>
      )}
      {data.cert_status === 'cert issued' && (
        <CWText>
          Cert status is finished, this means that the customer has set up the
          custom domain correctly, and it should be visible from your browser.
        </CWText>
      )}
    </>
  );
};

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
        given the &quot;CNAME&quot; for their DNS target.
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
            void refetch({ throwOnError: true }).catch((e) =>
              notifyError(e.message),
            )
          }
        />
      </div>
      {data && parseResponse(data)}
    </div>
  );
};

export default RefreshCustomDomainTask;
