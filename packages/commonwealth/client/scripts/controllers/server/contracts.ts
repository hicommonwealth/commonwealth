import { ContractsStore } from 'stores';
import Contract from '../../models/Contract';
class ContractsController {
  private _store: ContractsStore = new ContractsStore();
  private _initialized = false;

  public get store() {
    return this._store;
  }

  public get initialized() {
    return this._initialized;
  }

  public getByType(type: string) {
    return this._store.getContractByType(type);
  }

  public initialize(contractsWithTemplates = [], reset = true) {
    if (reset) {
      this._store.clear();
    }
    contractsWithTemplates.forEach((contractWithTemplate) => {
      try {
        let abiJson: Array<Record<string, unknown>>;
        let ccts: Array<{
          id: number;
          communityContractId: number;
          templateId: number;
          cctmd: {
            id: number;
            slug: string;
            nickname: string;
            display_name: string;
            display_options: string;
            enabled_by: string;
          };
        }>;
        // @ts-expect-error StrictNullChecks
        if (contractWithTemplate.contract.ContractAbi) {
          // @ts-expect-error StrictNullChecks
          abiJson = contractWithTemplate.contract.ContractAbi.abi;
        }
        // @ts-expect-error StrictNullChecks
        if (contractWithTemplate.ccts) {
          // @ts-expect-error StrictNullChecks
          ccts = contractWithTemplate.ccts.map((cct) => {
            return {
              id: cct.id,
              communityContractId: cct.community_contract_id,
              templateId: cct.template_id,
            };
          });
        }

        this._store.add(
          Contract.fromJSON({
            // @ts-expect-error StrictNullChecks
            ...contractWithTemplate.contract,
            // @ts-expect-error StrictNullChecks
            abi: abiJson,
            // @ts-expect-error StrictNullChecks
            ccts: ccts,
            // @ts-expect-error StrictNullChecks
            hasGlobalTemplate: contractWithTemplate.hasGlobalTemplate,
          }),
        );
      } catch (e) {
        console.error(e);
      }
    });

    this._initialized = true;
  }
}

export default ContractsController;
