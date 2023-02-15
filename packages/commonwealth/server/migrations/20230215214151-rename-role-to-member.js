"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // rename sequences
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "CommunityRoles_id_seq" RENAME TO "MemberClasses_id_seq";`,
        { transaction: t, logging: console.log },
      );
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "RoleAssignments_id_seq" RENAME TO "Memberships_id_seq";`,
        { transaction: t, logging: console.log },
      );

      // rename tables
      await queryInterface.sequelize.query(
        `ALTER TABLE "CommunityRoles" RENAME TO "MemberClasses";`,
        { transaction: t, logging: console.log },
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "RoleAssignments" RENAME TO "Memberships";`,
        { transaction: t, logging: console.log },
      );

      // rename columns
      await queryInterface.sequelize.query(
        `ALTER TABLE "Memberships" RENAME COLUMN "community_role_id" TO "member_class_id";`,
        { transaction: t, logging: console.log },
      );

      // rename foreign keys
      await queryInterface.sequelize.query(
        `ALTER TABLE "MemberClasses" RENAME CONSTRAINT "CommunityRoles_chain_id_fkey" TO "MemberClasses_chain_id_fkey";`,
        { transaction: t, logging: console.log },
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "Memberships" RENAME CONSTRAINT "RoleAssignments_address_id_fkey" TO "Memberships_address_id_fkey";`,
        { transaction: t, logging: console.log },
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "Memberships" RENAME CONSTRAINT "RoleAssignments_community_role_id_fkey" TO "Memberships_member_class_id_fkey";`,
        { transaction: t, logging: console.log },
      );

      // rename indexes
      await queryInterface.sequelize.query(
        `ALTER INDEX "RoleAssignments_pkey" RENAME TO "Memberships_pkey";`,
        { transaction: t, logging: console.log },
      );
      await queryInterface.sequelize.query(
        `ALTER INDEX "CommunityRoles_pkey" RENAME TO "MemberClasses_pkey";`,
        { transaction: t, logging: console.log },
      );

      // rename enums
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_CommunityRoles_name" RENAME TO "enum_MemberClasses_name";`,
        { transaction: t, logging: console.log },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // rename sequences
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "MemberClasses_id_seq" RENAME TO "CommunityRoles_id_seq";`,
        { transaction: t, logging: console.log },
      );
      await queryInterface.sequelize.query(
        `ALTER SEQUENCE "Memberships_id_seq" RENAME TO "RoleAssignments_id_seq";`,
        { transaction: t, logging: console.log },
      );

      // rename tables
      await queryInterface.sequelize.query(
        `ALTER TABLE "MemberClasses" RENAME TO "CommunityRoles";`,
        { transaction: t, logging: console.log },
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "Memberships" RENAME TO "RoleAssignments";`,
        { transaction: t, logging: console.log },
      );

      // rename columns
      await queryInterface.sequelize.query(
        `ALTER TABLE "RoleAssignments" RENAME COLUMN "member_class_id" TO "community_role_id";`,
        { transaction: t, logging: console.log },
      );

      // rename foreign keys
      await queryInterface.sequelize.query(
        `ALTER TABLE "CommunityRoles" RENAME CONSTRAINT "MemberClasses_chain_id_fkey" TO "CommunityRoles_chain_id_fkey";`,
        { transaction: t, logging: console.log },
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "RoleAssignments" RENAME CONSTRAINT "Memberships_address_id_fkey" TO "RoleAssignments_address_id_fkey";`,
        { transaction: t, logging: console.log },
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "RoleAssignments" RENAME CONSTRAINT "Memberships_member_class_id_fkey" TO "RoleAssignments_community_role_id_fkey";`,
        { transaction: t, logging: console.log },
      );

      // rename indexes
      await queryInterface.sequelize.query(
        `ALTER INDEX "Memberships_pkey" RENAME TO "RoleAssignments_pkey";`,
        { transaction: t, logging: console.log },
      );
      await queryInterface.sequelize.query(
        `ALTER INDEX "MemberClasses_pkey" RENAME TO "CommunityRoles_pkey";`,
        { transaction: t, logging: console.log },
      );

      // rename enums
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_MemberClasses_name" RENAME TO "enum_CommunityRoles_name";`,
        { transaction: t, logging: console.log },
      );
    });
  }
};
