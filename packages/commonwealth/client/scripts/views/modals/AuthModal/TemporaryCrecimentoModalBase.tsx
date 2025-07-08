// IMPORTANT:
// - this component is to be deleted after the "Crecimento Hackathon" event
// - this should be the only component having "Crecimento Hackathon" event specific changes (for easy removal later on)
// https://github.com/hicommonwealth/commonwealth/milestone/133

import { useFlag } from 'hooks/useFlag';
import React from 'react';
import AuthButton from '../../components/AuthButton';
import '../../components/AuthButton/AuthButton.scss';
import { CWText } from '../../components/component_kit/cw_text';

type TemporaryCrecimentoModalBaseProps = {
  onTwitterSignIn: () => void;
  onOtherMethodsSignIn: () => void;
};

const TemporaryCrecimentoModalBase = ({
  onOtherMethodsSignIn,
  onTwitterSignIn,
}: TemporaryCrecimentoModalBaseProps) => {
  const crecimentoHackathonEnabled = useFlag('crecimentoHackathon');
  if (!crecimentoHackathonEnabled) return <></>;

  return (
    <>
      <AuthButton type="x" onClick={onTwitterSignIn} />
      <button
        style={{ minHeight: 52, height: 52 }}
        className="AuthButton light"
        onClick={() => onOtherMethodsSignIn()}
      >
        <div className="info">
          <CWText type="h5" className="label">
            Other Login Options
          </CWText>
        </div>
      </button>
    </>
  );
};

export { TemporaryCrecimentoModalBase };
