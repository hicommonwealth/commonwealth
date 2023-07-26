import React, { useState } from 'react';
import ViewTemplateForm from '../view_template/view_template_form';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import '../../../../styles/pages/view_thread/view_template_form_card.scss';

export const ViewTemplateFormCard = ({ address, slug }) => {
  const [nickname, setNickname] = useState('Template Form');

  return (
    <CWContentPageCard
      header={nickname}
      content={
        <div className="ViewTemplateFormCard">
          <ViewTemplateForm
            address={address}
            slug={slug}
            setTemplateNickname={setNickname}
          />
        </div>
      }
    />
  );
};
