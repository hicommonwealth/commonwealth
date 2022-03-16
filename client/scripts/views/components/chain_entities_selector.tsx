/* @jsx m */

import m from 'mithril';
import { uuidv4 } from 'lib/util';
import { QueryList, ListItem } from 'construct-ui';

import 'components/chain_entities_selector.scss';

import app from 'state';
import { ChainEntity, OffchainThread } from 'models';
import { chainEntityTypeToProposalName } from 'identifiers';
import { EntityRefreshOption } from 'controllers/server/chain_entities';

type ChainEntitiesSelectorAttrs = {
  chainEntitiesToSet: ChainEntity[];
  onSelect: () => void;
  thread: OffchainThread;
};

export class ChainEntitiesSelector
  implements m.ClassComponent<ChainEntitiesSelectorAttrs>
{
  private chainEntitiesLoaded: boolean;
  private initialized: boolean;

  view(vnode) {
    const { thread, onSelect } = vnode.attrs;

    if (!app.chain || !app.activeChainId()) return;

    if (!this.initialized) {
      this.initialized = true;
      app.chain.chainEntities
        ?.refresh(app.chain.id, EntityRefreshOption.AllEntities)
        .then(() => {
          // refreshing loads the latest chain entities into app.chain.chainEntities store
          this.chainEntitiesLoaded = true;
          m.redraw();
        });
    }

    return (
      <div class="ChainEntitiesSelector">
        {this.chainEntitiesLoaded ? (
          <QueryList
            checkmark={true}
            items={app.chain.chainEntities.store.getAll().sort((a, b) => {
              if (!a.threadId && b.threadId) return -1;
              if (a.threadId && !b.threadId) return 1;
              return 0;
            })}
            inputAttrs={{
              placeholder: 'Search for an existing proposal...',
            }}
            itemRender={(ce: ChainEntity) => {
              const selected =
                vnode.attrs.chainEntitiesToSet
                  .map((ce_) => ce_.id)
                  .indexOf(ce.id) !== -1;
              // TODO: show additional info on the ListItem,
              // like any set proposal title, the creator, or other metadata
              return (
                <ListItem
                  disabled={ce.threadId && ce.threadId !== thread.id}
                  label={
                    <div class="chain-entity-info">
                      <span>
                        {chainEntityTypeToProposalName(ce.type) +
                          (ce.typeId.startsWith('0x')
                            ? ` ${ce.typeId.slice(0, 6)}...`
                            : ` #${ce.typeId}`)}
                      </span>
                      <span>
                        {ce.threadTitle !== 'undefined'
                          ? decodeURIComponent(ce.threadTitle)
                          : ''}
                      </span>
                    </div>
                  }
                  selected={selected}
                  key={ce.id ? ce.id : uuidv4()}
                />
              );
            }}
            itemPredicate={(query, ce: ChainEntity) => {
              if (ce.typeId.startsWith('0x')) {
                return false;
              } else {
                return (
                  ce.typeId
                    .toString()
                    .toLowerCase()
                    .includes(query.toLowerCase()) ||
                  ce.title
                    ?.toString()
                    .toLowerCase()
                    .includes(query.toLowerCase()) ||
                  chainEntityTypeToProposalName(ce.type)
                    .toLowerCase()
                    .includes(query.toLowerCase())
                );
              }
            }}
            onSelect={(ce: ChainEntity) => {
              if (
                vnode.attrs.chainEntitiesToSet
                  .map((ce_) => ce_.id)
                  .indexOf(ce.id) !== -1
              ) {
                const index = vnode.attrs.chainEntitiesToSet.findIndex(
                  (ce_) => ce_.id === ce.id
                );
                vnode.attrs.chainEntitiesToSet.splice(index, 1);
              } else {
                vnode.attrs.chainEntitiesToSet.push(ce);
              }
              onSelect(ce);
            }}
          />
        ) : (
          <div class="laoding-container">
            <div class="loading-container-text">
              {this.chainEntitiesLoaded
                ? 'Select "In Voting" to begin.'
                : 'Loading on-chain proposals...'}
            </div>
          </div>
        )}
      </div>
    );
  }
}
