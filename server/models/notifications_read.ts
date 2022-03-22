import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { SubscriptionAttributes } from './subscription';
import { NotificationAttributes } from './notification';

export type NotificationsReadAttributes = {
	subscription_id: number;
	notification_id: number;
	is_read: boolean;
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
		subscription_id: { type: dataTypes.INTEGER, primaryKey: true },
		notification_id: { type: dataTypes.INTEGER, primaryKey: true },
		is_read: { type: dataTypes.BOOLEAN, defaultValue: false, allowNull: false },
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
