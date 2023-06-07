import React, { useEffect, useState } from 'react';

import app from 'state';

import 'pages/manage_community/persona_form.scss';

import { notifyError } from 'controllers/app/notifications';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWTextInput } from '../../components/component_kit/cw_text_input';

export const FilteredPersonas = () => {
  const [name, setName] = useState('');
  const [personas, setPersonas] = useState([]);

  useEffect(() => {
    const fetchFilteredPersonas = async () => {
      try {
        const filteredPersonas = await app.personas.getFilteredPersonas(name);
        setPersonas(filteredPersonas);
      } catch (error) {
        console.error('Error fetching filtered personas:', error);
      }
    };

    if (name) {
      fetchFilteredPersonas();
    } else {
      (async () => {
        try {
          const basePersona = await app.personas.getByName('Dillbot');
          setPersonas([basePersona]);
        } catch (error) {
          console.error('Error fetching base persona:', error);
        }
      })();
    }
  }, [name]);

  console.log('personas', personas);

  return (
    <div>
      <input
        type="text"
        placeholder="Filter personas by name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {personas.length > 0 ? (
        <ul>
          {personas.map((persona) => (
            <li key={persona.name}>
              {persona.name} - {persona.personality}
            </li>
          ))}
        </ul>
      ) : (
        <p>No personas found</p>
      )}
    </div>
  );
};

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
        <FilteredPersonas />
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
