import { type DB } from '@hicommonwealth/model';
import sgMail from '@sendgrid/mail';
import { config } from '../config';

import {
  __emit,
  EmitOptions,
  EmitResult,
} from './server_notifications_methods/emit';
sgMail.setApiKey(config.SENDGRID.API_KEY);

/**
 * Implements methods related to notifications
 *
 */
export class ServerNotificationsController {
  constructor(public models: DB) {}

  async emit(options: EmitOptions): Promise<EmitResult> {
    return __emit.call(this, options);
  }
}
