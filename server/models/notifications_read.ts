import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { SubscriptionAttributes } from './subscription';
import { NotificationAttributes } from './notification';

export type NotificationsReadAttributes = {
	id: number;
	subscription_id: number;
	notification_id: number;
	is_read: boolean;
	user_id: number;
	Subscription?: SubscriptionAttributes;
	Notification?: NotificationAttributes;
}

export type NotificationsReadInstance = ModelInstance<NotificationsReadAttributes>;

export type NotificationsReadModelStatic = ModelStatic<NotificationsReadInstance>;

export default (
	sequelize: Sequelize.Sequelize,
	dataTypes: typeof DataTypes,
): NotificationsReadModelStatic => {
	const NotificationsRead = <NotificationsReadModelStatic>sequelize.define('NotificationsRead', {
		id: {type: dataTypes.INTEGER, allowNull: true},
		subscription_id: { type: dataTypes.INTEGER, primaryKey: true },
		notification_id: { type: dataTypes.INTEGER, primaryKey: true },
		is_read: { type: dataTypes.BOOLEAN, defaultValue: false, allowNull: false },
		user_id: { type: dataTypes.INTEGER, defaultValue: false, allowNull: false, references: {model: 'User', key: 'id'} }
	}, {
		tableName: 'NotificationsRead',
		underscored: true,
		timestamps: false
	});

	NotificationsRead.associate = (models) => {
		models.NotificationsRead.belongsTo(models.Subscription, { foreignKey: 'subscription_id', targetKey: 'id' });
		models.NotificationsRead.belongsTo(models.Notification, { foreignKey: 'notification_id', targetKey: 'id' });
	};

	return NotificationsRead;
};
