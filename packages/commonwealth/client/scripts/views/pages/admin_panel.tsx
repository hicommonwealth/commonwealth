import React, { useEffect } from 'react';

import Sublayout from 'views/sublayout';
import { CWEmptyState } from '../components/component_kit/cw_empty_state';
import { CWText } from '../components/component_kit/cw_text';
import app from 'state';
import { useCommonNavigate } from 'navigation/helpers';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { valueContainerCSS } from 'react-select/dist/declarations/src/components/containers';
import { CWButton } from '../components/component_kit/cw_button';
import {
  ConfirmationModal,
  openConfirmation,
} from '../modals/confirmation_modal';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import axios from 'axios';
import 'pages/admin_panel.scss';

const AdminPanel = () => {
  const navigate = useCommonNavigate();

  useEffect(() => {
    if (!app.user.isSiteAdmin) {
      // redirect to 404
      navigate('/404');
    }
  }, []);

  // State
  const [deleteChainValue, setDeleteChainValue] = React.useState<string>('');
  const [deleteChainValueValidated, setDeleteChainValueValidated] =
    React.useState<boolean>(false);

  return (
    <Sublayout
    // title={title}
    >
      <div className="AdminPanel">
        <CWText type="h2">Admin Tasks</CWText>
        <div className="TaskGroup">
          <CWText type="h4">Delete Community</CWText>
          <CWText type="caption">
            Removes a CW community (chain) from the DB. This is destructive
            action that cannot be reversed.
          </CWText>
          <div className="TaskRow">
            <CWTextInput
              label="Community Id"
              value={deleteChainValue}
              onInput={(e) => {
                setDeleteChainValue(e.target.value);
                if (e.target.value.length === 0)
                  setDeleteChainValueValidated(false);
              }}
              inputValidationFn={(value: string) => {
                if (!app.config.chains.getById(value)) {
                  setDeleteChainValueValidated(false);
                  return ['failure', 'Community not found'];
                }
                setDeleteChainValueValidated(true);
                return [];
              }}
            />
            <CWButton
              label="Delete"
              className="TaskButton"
              disabled={!deleteChainValueValidated}
              onClick={() => {
                openConfirmation({
                  title: 'Delete Community',
                  description: `Are you sure you want to delete ${deleteChainValue}? This action cannot be reversed. Note that this will NOT work if there is an admin in the community.`,
                  buttons: [
                    {
                      label: 'Delete',
                      buttonType: 'mini-red',
                      onClick: async () => {
                        try {
                          await axios.post(`${app.serverUrl()}/deleteChain`, {
                            id: deleteChainValue,
                            jwt: app.user.jwt,
                          });
                          setDeleteChainValue('');
                          notifySuccess('Community deleted');
                        } catch (e) {
                          notifyError('Error deleting community');

                          console.error(e);
                        }
                      },
                    },
                    {
                      label: 'Cancel',
                      buttonType: 'mini-white',
                    },
                  ],
                });
              }}
            />
          </div>
        </div>
      </div>
    </Sublayout>
  );
};

export default AdminPanel;
