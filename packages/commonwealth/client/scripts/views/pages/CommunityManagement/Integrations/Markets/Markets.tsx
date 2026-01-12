import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './Markets.scss';

const Markets = () => {
  const navigate = useCommonNavigate();

  return (
    <section className="Markets">
      <div className="header">
        <CWText type="h4">Markets</CWText>
        <CWText type="b1">Discover and manage to prediction markets</CWText>
      </div>

      <CWButton
        buttonType="secondary"
        label="Manage"
        onClick={() => navigate('/manage/integrations/markets')}
      />
    </section>
  );
};

export default Markets;
