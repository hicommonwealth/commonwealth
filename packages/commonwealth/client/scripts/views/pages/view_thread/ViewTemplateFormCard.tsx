import React, { useState } from 'react';
import ViewTemplate from '../view_template/view_template';
import { CWContentPageCard } from '../../components/component_kit/CWContentPage';
import '../../../../styles/pages/view_thread/view_template_form_card.scss';

export const ViewTemplateFormCard = ({ address, slug }) => {
  const [nickname, setNickname] = useState('Template Form');

  return (
    <CWContentPageCard
      header={nickname}
      content={
        <div className="ViewTemplateFormCard">
          <ViewTemplate
            contract_address={address}
            slug={slug}
            setTemplateNickname={setNickname}
            isForm={true}
          />
        </div>
      }
    />
  );
};
