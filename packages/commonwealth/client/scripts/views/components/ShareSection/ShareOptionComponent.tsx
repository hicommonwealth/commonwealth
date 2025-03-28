import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { ShareOption } from './ShareOption';

export const ShareOptionComponent = (props: ShareOption) => {
  const { name, icon, onClick } = props;

  return (
    <div key={name} className="share-option" onClick={onClick}>
      {typeof icon === 'string' && (
        <img src={icon} alt={name} className="icon" />
      )}

      {typeof icon !== 'string' && <>{icon}</>}

      <CWText type="caption">{name}</CWText>
    </div>
  );
};
