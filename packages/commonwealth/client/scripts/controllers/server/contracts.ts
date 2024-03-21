import { AbiType } from '@hicommonwealth/core';
import axios from 'axios';
import app from 'state';
import { ContractsStore } from 'stores';
import Contract from '../../models/Contract';

type AddCommunityContractTemplateAttributes = {
  slug: string;
  nickname: string;
  display_name: string;
  display_options: string;
  contract_id: number;
  community_id: string;
  template_id: number;
  enabled_by: string;
};

type EditCommunityContractTemplateAttributes = {
  cct_id: string;
  slug: string;
  nickname: string;
  display_name: string;
  display_options: string;
  contract_id: number;
};

class ContractsController {
  private _store: ContractsStore = new ContractsStore();
  private _initialized = false;

  public get store() {
    return this._store;
  }

  public get initialized() {
    return this._initialized;
  }
  public getByNickname(nickname: string) {
    return this._store.getContractByNickname(nickname);
  }
  public getByIdentifier(id) {
    return this._store.getById(id);
  }
  public getByAddress(address: string) {
    return this._store.getContractByAddress(address);
  }
  public getByType(type: string) {
    return this._store.getContractByType(type);
  }
  public getContractFactories() {
    return this._store.getContractFactories();
  }
  public getCommunityContracts() {
    return this._store.getCommunityContracts();
  }

  public async checkFetchEtherscanForAbi(address: string) {
    const response = await axios.post(
      `${app.serverUrl()}/etherscanAPI/fetchEtherscanContract`,
      {
        address,
        jwt: app.user.jwt,
      },
    );
    const resultContract = response.data.result.contract;
    const resultAbi = response.data.result.contractAbi;
    this.update(resultAbi.abi, resultContract);
  }

  public async getAbiFromEtherscan(address: string): Promise<AbiType> {
    const response = await axios.post(
      `${app.serverUrl()}/etherscanAPI/fetchEtherscanContractAbi`,
      {
        address,
        chain_node_id: app.chain.meta.ChainNode.id,
        jwt: app.user.jwt,
      },
    );

    return response.data.result.contractAbi;
  }

  public async update(
    abi: Array<Record<string, unknown>>,
    contractAttributes: any,
  ) {
    // Update contract in store
    if (this._store.getById(contractAttributes.id)) {
      this._store.remove(this._store.getById(contractAttributes.id));
    }
    const {
      id,
      address,
      chain_node_id,
      type,
      createdAt,
      updatedAt,
      decimals,
      token_name,
      symbol,
      is_factory,
      nickname,
      ccts,
    } = contractAttributes;
    this._store.add(
      new Contract({
        id,
        address,
        chainNodeId: chain_node_id,
        type,
        createdAt,
        updatedAt,
        decimals,
        tokenName: token_name,
        symbol,
        abi,
        isFactory: is_factory,
        nickname,
        ccts,
      }),
    );
  }

  public async updateTemplate({
    contract_id,
    cct_id,
    cctmd,
    isNewCCT,
    template_id,
    isDeletion = false,
  }: {
    contract_id: number;
    cct_id: number;
    cctmd: {
      id: number;
      slug: string;
      nickname: string;
      display_name: string;
      display_options: string;
      enabled_by: string;
      created_at: Date;
    };
    isNewCCT: boolean;
    template_id?: number;
    isDeletion?: boolean;
  }) {
    const currentContractInStore = this._store.getById(contract_id);
    // TODO: Verify that this is a shallow copy situation
    this._store.remove(this._store.getById(contract_id));

    // Update the cctmd in the ccts array
    if (!isNewCCT) {
      let ccts = currentContractInStore.ccts.map((cct) => {
        if (cct.id === cct_id) {
          return {
            ...cct,
            cctmd: { ...cctmd },
          };
        } else {
          return cct;
        }
      });

      // reduce the ccts array if we're deleting
      if (isDeletion) {
        // remove the cct from the ccts array
        ccts = ccts.filter((cct) => cct.id !== cct_id);
      }

      this._store.add(new Contract({ ...currentContractInStore, ccts }));
    } else {
      const ccts = currentContractInStore.ccts || [];
      ccts.push({
        id: cct_id,
        communityContractId: contract_id,
        templateId: template_id,
        cctmd: { ...cctmd },
      });
      this._store.add(new Contract({ ...currentContractInStore, ccts }));
    }
  }

  public async addContractAndAbi({
    chain_node_id,
    address,
    abi,
  }: {
    chain_node_id: number;
    address: string;
    abi?: string;
  }) {
    try {
      const response = await axios.post(`${app.serverUrl()}/contract`, {
        community_id: app.activeChainId(),
        chain_node_id,
        jwt: app.user.jwt,
        address,
        abi,
      });

      const responseContract = response.data.result.contract;
      const { id, type, is_factory } = responseContract;

      const result = new Contract({
        id,
        address,
        chainNodeId: chain_node_id,
        type,
        abi: JSON.parse(abi),
        isFactory: is_factory,
        hasGlobalTemplate: response.data.result.hasGlobalTemplate,
      });

      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }

      this._store.add(result);
    } catch (err) {
      console.log('err', err);
      throw new Error('Failed to add contract');
    }
  }

  public async addTemplate({
    name,
    template,
    contract_id,
    description,
    community,
  }: {
    name: string;
    template: string;
    contract_id: string;
    description: string;
    community: string;
  }) {
    try {
      const response = await axios.post(
        `${app.serverUrl()}/contract/template`,
        {
          jwt: app.user.jwt,
          community_id: app.activeChainId(),
          name,
          template,
          contract_id,
          description,
          created_by: app.user.activeAccount.address,
          created_for_community: community,
        },
      );

      const contract = this._store.getById(contract_id);
      this._store.remove(this._store.getById(contract_id));
      this._store.add(new Contract({ ...contract, hasGlobalTemplate: true }));
      return response.data.result.template_id;
    } catch (err) {
      console.log(err);
      throw new Error('Failed to create template');
    }
  }

  public async deleteTemplate({ templateId }: { templateId: string }) {
    try {
      await axios.delete(`${app.serverUrl()}/contract/template`, {
        params: {
          jwt: app.user.jwt,
          template_id: templateId,
        },
      });
    } catch (err) {
      console.log(err);
      throw new Error('Failed to delete template');
    }
  }

  public async getTemplatesForContract(contractId: number) {
    try {
      const res = await axios.get(`${app.serverUrl()}/contract/template`, {
        params: {
          jwt: app.user.jwt,
          contract_id: contractId,
        },
      });
      return res.data.result.templates;
    } catch (e) {
      console.log(e);
      throw new Error('Failed to get templates');
    }
  }

  public async addCommunityContractTemplate(
    communityContractTemplateAndMetadata: AddCommunityContractTemplateAttributes,
  ) {
    try {
      const newContract = await axios.post(
        `${app.serverUrl()}/contract/community_template_and_metadata`,
        {
          ...communityContractTemplateAndMetadata,
          community_id: app.activeChainId(),
          jwt: app.user.jwt,
        },
      );

      this.updateTemplate({
        contract_id: communityContractTemplateAndMetadata.contract_id,
        cct_id: newContract.data.result.cct.id,
        cctmd: newContract.data.result.metadata,
        isNewCCT: true,
        template_id: communityContractTemplateAndMetadata.template_id,
      });
    } catch (err) {
      console.log(err);
      throw new Error('Failed to add community contract template');
    }
  }

  public async editCommunityContractTemplate(
    communityContractTemplateMetadata: EditCommunityContractTemplateAttributes,
  ) {
    try {
      const updateContract = await axios.put(
        `${app.serverUrl()}/contract/community_template`,
        {
          params: {
            ...communityContractTemplateMetadata,
            community_id: app.activeChainId(),
            jwt: app.user.jwt,
          },
        },
      );

      this.updateTemplate({
        contract_id: communityContractTemplateMetadata.contract_id,
        cct_id: updateContract.data.result.cct.id,
        cctmd: updateContract.data.result.metadata,
        isNewCCT: false,
      });
    } catch (err) {
      console.log(err);
      throw new Error('Failed to save community contract template');
    }
  }

  public async deleteCommunityContractTemplate(contract: {
    contract_id: number;
    template_id: number;
    cctmd_id: number;
  }) {
    try {
      const res = await axios.delete(
        `${app.serverUrl()}/contract/community_template`,
        {
          params: {
            ...contract,
            jwt: app.user.jwt,
            community_id: app.activeChainId(),
          },
        },
      );

      if (res.data.result.deletedContract) {
        this._store.remove(this._store.getById(contract.contract_id));
      } else {
        this.updateTemplate({
          contract_id: contract.contract_id,
          cct_id: res.data.result.cct.id,
          cctmd: res.data.result.metadata,
          isNewCCT: false,
          isDeletion: true,
        });
      }
    } catch (err) {
      console.log(err);
      throw new Error('Failed to delete contract template');
    }
  }

  public async deleteCommunityContract(contract: {
    contract_id: number;
    template_id?: number;
  }) {
    try {
      const contractToDelete = this._store.getById(contract.contract_id);

      await axios.delete(
        `${app.serverUrl()}/contract/community_template?community_contract=true`,
        {
          params: {
            ...contract,
            jwt: app.user.jwt,
            community_id: app.activeChainId(),
          },
        },
      );

      this._store.remove(contractToDelete);
    } catch (err) {
      console.log(err);
      throw new Error('Failed to delete contract');
    }
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
        if (contractWithTemplate.contract.ContractAbi) {
          abiJson = contractWithTemplate.contract.ContractAbi.abi;
        }
        if (contractWithTemplate.ccts) {
          ccts = contractWithTemplate.ccts.map((cct) => {
            return {
              id: cct.id,
              communityContractId: cct.community_contract_id,
              templateId: cct.template_id,
              cctmd: cct.CommunityContractTemplateMetadatum,
            };
          });
        }

        this._store.add(
          Contract.fromJSON({
            ...contractWithTemplate.contract,
            abi: abiJson,
            ccts: ccts,
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
