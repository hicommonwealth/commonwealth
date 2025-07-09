import { CreateGroup, UpdateGroup } from '@hicommonwealth/schemas';
import React, { useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { z } from 'zod';

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

interface AllowlistFormProps {
  groupState:
    | z.infer<typeof CreateGroup.input>
    | z.infer<typeof UpdateGroup.input>;
  setGroupState: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
}

const AllowlistForm: React.FC<AllowlistFormProps> = ({
  groupState,
  setGroupState,
  errors,
}) => {
  // Use requirements directly from schema
  const requirementsArr = Array.isArray(groupState.requirements)
    ? groupState.requirements
    : [];
  const allowReqIdx = requirementsArr.findIndex((r) => r.rule === 'allow');
  const allowReq = allowReqIdx >= 0 ? requirementsArr[allowReqIdx] : null;
  let addresses: string[] = [];
  if (
    allowReq &&
    allowReq.rule === 'allow' &&
    allowReq.data &&
    Array.isArray((allowReq.data as any).allow)
  ) {
    addresses = (allowReq.data as any).allow;
  }
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState('');

  const addAddress = () => {
    if (!addressRegex.test(input)) {
      setInputError('Invalid address');
      return;
    }
    setGroupState((prev) => {
      const newReqs = Array.isArray(prev.requirements)
        ? [...prev.requirements]
        : [];
      if (allowReqIdx === -1) {
        newReqs.push({ rule: 'allow', data: { allow: [input] } });
      } else {
        const newAllow = [...addresses, input];
        newReqs[allowReqIdx] = { rule: 'allow', data: { allow: newAllow } };
      }
      return { ...prev, requirements: newReqs };
    });
    setInput('');
    setInputError('');
  };

  const removeAddress = (idx: number) => {
    setGroupState((prev) => {
      let newReqs = Array.isArray(prev.requirements)
        ? [...prev.requirements]
        : [];
      if (allowReqIdx === -1) return prev;
      const newAllow = addresses.filter((_, i) => i !== idx);
      if (newAllow.length === 0) {
        newReqs = newReqs.filter((r) => r.rule !== 'allow');
      } else {
        newReqs[allowReqIdx] = { rule: 'allow', data: { allow: newAllow } };
      }
      return { ...prev, requirements: newReqs };
    });
  };

  return (
    <section className="form-section">
      <CWText type="h3" fontWeight="semiBold" className="header-text">
        Allowlist
      </CWText>
      <CWText type="b2">
        These users are added directly to the group and may bypass additional
        requirements
      </CWText>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <CWTextInput
          name="allowlistInput"
          label="Add address"
          value={input}
          onChange={(e) =>
            setInput(
              (e as React.ChangeEvent<HTMLInputElement>).currentTarget.value,
            )
          }
          customError={inputError}
        />
        <CWButton label="Add" type="button" onClick={addAddress} />
      </div>
      <ul>
        {addresses.map((addr, idx) => (
          <li
            key={addr}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span>{addr}</span>
            <CWButton
              label="Remove"
              type="button"
              buttonType="destructive"
              onClick={() => removeAddress(idx)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AllowlistForm;
