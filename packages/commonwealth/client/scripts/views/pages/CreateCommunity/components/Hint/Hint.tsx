import React from 'react';

import FeatureHint from 'views/components/FeatureHint';

interface HintProps {
  className: string;
}

const Hint = ({ className }: HintProps) => (
  <FeatureHint
    className={className}
    title="What is a namespace?"
    hint="The namespace is an address that represents your community  on-chain.
          You can purchase additional community namespaces from the admin panel."
  />
);

export default Hint;
