import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';
import { SubscriptionAttributes } from './subscription';
import { NotificationAttributes } from './notification';

export interface NotificationsReadAttributes {
	subscription_id: number;
	notification_id: string;
	is_read: boolean;
	Subscription?: SubscriptionAttributes;
	Notification?: NotificationAttributes;
}

export interface NotificationsReadInstance
	extends Model<NotificationsReadAttributes>, NotificationsReadAttributes {}

export type NotificationsReadModelStatic = ModelStatic<NotificationsReadInstance>

export default (
	sequelize: Sequelize.Sequelize,
	dataTypes: typeof DataTypes,
): NotificationsReadModelStatic => {
	const Notification = <NotificationsReadModelStatic>sequelize.define('NotificationsRead', {
		subscription_id: { type: dataTypes.INTEGER, primaryKey: true },
		notification_id: { type: dataTypes.INTEGER, primaryKey: true },
		is_read: { type: dataTypes.BOOLEAN, defaultValue: false, allowNull: false },
	}, {
		tableName: 'Notifications_Read',
		underscored: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	});

	Notification.associate = (models) => {
		models.Notification.belongsTo(models.Subscription, { foreignKey: 'subscription_id', targetKey: 'id' });
		models.Notification.belongsTo(models.Notification, { foreignKey: 'notification_id', targetKey: 'id' });
	};

	return Notification;
};
