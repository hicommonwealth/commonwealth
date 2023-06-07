import React, { useState } from 'react';

import app from 'state';

import 'pages/manage_community/persona_form.scss';

import { notifyError } from 'controllers/app/notifications';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWTextInput } from '../../components/component_kit/cw_text_input';

export const AddPersona = () => {
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');

  const createPersona = async () => {
    try {
      await app.personas.createPersona({ name, personality });
      setName('');
      setPersonality('');
    } catch (err) {
      notifyError(err);
    }
  };

  return (
    <div className="PersonaForm">
      <div className="input-container">
        <CWTextInput
          className="text-input"
          placeholder="Persona Name"
          value={name}
          onInput={(e) => {
            setName(e.target.value);
          }}
        />
        <CWTextInput
          className="text-input"
          placeholder="Description"
          value={personality}
          onInput={(e) => {
            setPersonality(e.target.value);
          }}
        />
      </div>
      <CWButton
        className="create-persona-button"
        disabled={!name || !personality}
        label="Create Persona"
        onClick={createPersona}
      />
    </div>
  );
};
