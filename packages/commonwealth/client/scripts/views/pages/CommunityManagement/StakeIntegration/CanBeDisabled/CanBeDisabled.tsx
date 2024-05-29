import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import React from 'react';
import './CanBeDisabled.scss';

const CanBeDisabled = () => {
  return (
    <section className="CanBeDisabled">
      <CWText type="h5">Can stake be disabled?</CWText>
      <CWText type="b2">
        At this time stake can not be disabled within the product. The namespace
        or 1155 contract and the bonding curve contract will forever live
        on-chain. If your community wishes not see the community stake UI,
        please contact our team.
      </CWText>
    </section>
  );
};

export default CanBeDisabled;
