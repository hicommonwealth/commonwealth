import { AddressAttributes } from '@hicommonwealth/model';
import { expect } from 'chai';
import { validateOwner } from 'server/util/validateOwner';

describe('validateOwner', () => {
  describe('default behavior', () => {
    it('should deny user by default', async () => {
      const models: any = {
        // for findAllRoles
        Address: {
          findAll: async () => [],
        },
      };
      const user: any = {
        getAddresses: async () => [],
      };
      const chainId = 'ethereum';
      const entity: any = {};
      const allowMod = false;
      const allowAdmin = false;
      const allowSuperAdmin = false;

      const result = await validateOwner({
        models,
        user,
        communityId: chainId,
        entity,
        allowMod,
        allowAdmin,
        allowSuperAdmin,
      });

      expect(result).to.be.false;
    });
  });

  describe('check super admin mode', () => {
    it('should deny super admin mode user', async () => {
      const models: any = {
        // for findAllRoles
        Address: {
          findAll: async () => [],
        },
      };
      const user: any = {
        getAddresses: async () => [],
        isAdmin: true,
      };
      const chainId = 'ethereum';
      const entity: any = {};
      const allowMod = false;
      const allowAdmin = false;
      const allowSuperAdmin = false;

      const result = await validateOwner({
        models,
        user,
        communityId: chainId,
        entity,
        allowMod,
        allowAdmin,
        allowSuperAdmin,
      });

      expect(result).to.be.false;
    });

    it('should allow super admin user', async () => {
      const models: any = {};
      const user: any = {
        getAddresses: async () => [],
        isAdmin: true,
      };
      const chainId = 'ethereum';
      const entity: any = {};
      const allowMod = false;
      const allowAdmin = false;
      const allowSuperAdmin = true;

      const result = await validateOwner({
        models,
        user,
        communityId: chainId,
        entity,
        allowMod,
        allowAdmin,
        allowSuperAdmin,
      });

      expect(result).to.be.true;
    });
  });

  describe('check entity owner', () => {
    it('should deny non-owner user', async () => {
      const models: any = {
        // for findAllRoles
        Address: {
          findAll: async (): Promise<Partial<AddressAttributes>[]> => [],
        },
      };
      const user: any = {
        getAddresses: async () => [
          {
            id: 5,
            address: '0x567',
            verified: true,
          },
        ],
      };
      const chainId = 'ethereum';
      const entity: any = {
        id: 1,
        address_id: 2,
      };
      const allowMod = false;
      const allowAdmin = false;
      const allowSuperAdmin = false;
      const result = await validateOwner({
        models,
        user,
        communityId: chainId,
        entity,
        allowMod,
        allowAdmin,
        allowSuperAdmin,
      });
      expect(result).to.be.false;
    });

    it('should allow owner user', async () => {
      const models: any = {
        // for findAllRoles
        Address: {
          findAll: async (): Promise<Partial<AddressAttributes>[]> => [],
        },
      };
      const user: any = {
        getAddresses: async () => [
          {
            id: 2,
            address: '0x234',
            verified: true,
          },
        ],
      };
      const chainId = 'ethereum';
      const entity: any = {
        id: 1,
        address_id: 2,
      };
      const allowMod = false;
      const allowAdmin = false;
      const allowSuperAdmin = false;
      const result = await validateOwner({
        models,
        user,
        communityId: chainId,
        entity,
        allowMod,
        allowAdmin,
        allowSuperAdmin,
      });
      expect(result).to.be.true;
    });
  });

  describe('check moderator/admin', () => {
    it('should deny moderator', async () => {
      const models: any = {
        // for findAllRoles
        Address: {
          findAll: async (): Promise<Partial<AddressAttributes>[]> => [
            {
              id: 1,
              address: '0x123',
              role: 'moderator',
              community_id: 'ethereum',
            },
          ],
        },
      };
      const user: any = {
        getAddresses: async () => [],
      };
      const chainId = 'ethereum';
      const entity = null;
      const allowMod = false;
      const allowAdmin = false;
      const allowSuperAdmin = false;
      const result = await validateOwner({
        models,
        user,
        communityId: chainId,
        entity,
        allowMod,
        allowAdmin,
        allowSuperAdmin,
      });
      expect(result).to.be.false;
    });

    it('should allow moderator', async () => {
      const models: any = {
        // for findAllRoles
        Address: {
          findAll: async (): Promise<Partial<AddressAttributes>[]> => [
            {
              id: 1,
              address: '0x123',
              role: 'moderator',
              community_id: 'ethereum',
            },
          ],
        },
      };
      const user: any = {
        getAddresses: async () => [],
      };
      const chainId = 'ethereum';
      const entity = null;
      const allowMod = true;
      const allowAdmin = false;
      const allowSuperAdmin = false;
      const result = await validateOwner({
        models,
        user,
        communityId: chainId,
        entity,
        allowMod,
        allowAdmin,
        allowSuperAdmin,
      });
      expect(result).to.be.true;
    });
  });

  it('should deny admin', async () => {
    const models: any = {
      // for findAllRoles
      Address: {
        findAll: async (): Promise<Partial<AddressAttributes>[]> => [
          {
            id: 1,
            address: '0x123',
            role: 'admin',
            community_id: 'ethereum',
          },
        ],
      },
    };
    const user: any = {
      getAddresses: async () => [],
    };
    const chainId = 'ethereum';
    const entity = null;
    const allowMod = false;
    const allowAdmin = false;
    const allowSuperAdmin = false;
    const result = await validateOwner({
      models,
      user,
      communityId: chainId,
      entity,
      allowMod,
      allowAdmin,
      allowSuperAdmin,
    });
    expect(result).to.be.false;
  });

  it('should allow admin', async () => {
    const models: any = {
      // for findAllRoles
      Address: {
        findAll: async (): Promise<Partial<AddressAttributes>[]> => [
          {
            id: 1,
            address: '0x123',
            role: 'admin',
            community_id: 'ethereum',
          },
        ],
      },
    };
    const user: any = {
      getAddresses: async () => [],
    };
    const chainId = 'ethereum';
    const entity = null;
    const allowMod = false;
    const allowAdmin = true;
    const allowSuperAdmin = false;
    const result = await validateOwner({
      models,
      user,
      communityId: chainId,
      entity,
      allowMod,
      allowAdmin,
      allowSuperAdmin,
    });
    expect(result).to.be.true;
  });
});
