import * as Sequelize from 'sequelize';

export interface NotificationCategoryAttributes {
  name: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface NotificationCategoryInstance
extends Sequelize.Instance<NotificationCategoryAttributes>, NotificationCategoryAttributes {

}

export interface NotificationCategoryModel
extends Sequelize.Model<NotificationCategoryInstance, NotificationCategoryAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): NotificationCategoryModel => {
  const NotificationCategory = sequelize.define<
    NotificationCategoryInstance, NotificationCategoryAttributes
  >('NotificationCategory', {
    name: { type: dataTypes.STRING, primaryKey: true },
    description: { type: dataTypes.TEXT, allowNull: false },
  }, {
    underscored: true,
  });
  return NotificationCategory;
};
