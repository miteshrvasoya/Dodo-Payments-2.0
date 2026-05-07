import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/connection';
import { logger } from '../utils/logger';

export type WebhookEvent = 'invoice.created' | 'invoice.paid' | 'invoice.payment_failed';

export class WebhookService {
  /**
   * Dispatches a webhook event for a business.
   * This is non-blocking and handles retries internally.
   */
  static async trigger(businessId: string, eventType: WebhookEvent, payload: any) {
    // 1. Get all registered webhooks for this business
    const webhooks = await query('SELECT * FROM webhooks WHERE business_id = $1', [businessId]);
    
    if (!webhooks || webhooks.rows.length === 0) {
      return;
    }

    // 2. Dispatch to each endpoint
    for (const webhook of webhooks.rows) {
      this.deliver(webhook, eventType, payload).catch(err => {
        logger.error(`Webhook initial delivery failed for ${webhook.id}`, err);
      });
    }
  }

  private static async deliver(webhook: any, eventType: string, payload: any, retryCount = 0) {
    const deliveryId = uuidv4();
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      id: deliveryId,
      event: eventType,
      created_at: timestamp,
      data: payload
    });

    // 3. Sign the payload (HMAC-SHA256)
    const signatureContent = `${timestamp}.${body}`;
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(signatureContent)
      .digest('hex');

    try {
      const response = await fetch(webhook.endpoint_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Dodo-Signature': `t=${timestamp},v1=${signature}`,
          'X-Dodo-Delivery-Id': deliveryId
        },
        body: body,
        // Short timeout for webhook deliveries
        signal: AbortSignal.timeout(5000) 
      });

      const status = response.ok ? 'success' : 'failed';
      
      // 4. Record delivery
      await query(
        `INSERT INTO webhook_deliveries (id, webhook_id, event_type, payload, status, retry_count)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [deliveryId, webhook.id, eventType, body, status, retryCount]
      );

      if (!response.ok && retryCount < 5) {
        this.scheduleRetry(webhook, eventType, payload, retryCount + 1);
      }

    } catch (error) {
      logger.error(`Failed to deliver webhook ${webhook.id} attempt ${retryCount}`, error);
      
      await query(
        `INSERT INTO webhook_deliveries (id, webhook_id, event_type, payload, status, retry_count)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [deliveryId, webhook.id, eventType, body, 'error', retryCount]
      );

      if (retryCount < 5) {
        this.scheduleRetry(webhook, eventType, payload, retryCount + 1);
      }
    }
  }

  private static scheduleRetry(webhook: any, eventType: string, payload: any, nextRetryCount: number) {
    // Exponential backoff: 10s, 1m, 5m, 30m, 2h
    const backoffs = [10000, 60000, 300000, 1800000, 7200000];
    const delay = backoffs[nextRetryCount - 1] || 7200000;

    logger.info(`Scheduling webhook retry ${nextRetryCount} in ${delay}ms for ${webhook.id}`);
    
    setTimeout(() => {
      this.deliver(webhook, eventType, payload, nextRetryCount).catch(err => {
        logger.error(`Retry ${nextRetryCount} failed for ${webhook.id}`, err);
      });
    }, delay);
  }
}
