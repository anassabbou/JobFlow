import { UserSettings } from '../types/Settings';

type DiscordNotificationResult =
  | { status: 'disabled' }
  | { status: 'missing-webhook' }
  | { status: 'sent' }
  | { status: 'failed'; error: string };

class DiscordNotificationService {
  private getWebhookUrl(settings: UserSettings['discordNotifications']): string {
    return settings.webhookUrl || import.meta.env.VITE_DISCORD_WEBHOOK_URL || '';
  }

  async sendTestMessage(settings: UserSettings['discordNotifications']): Promise<DiscordNotificationResult> {
    if (!settings.enabled) {
      return { status: 'disabled' };
    }

    const webhookUrl = this.getWebhookUrl(settings);
    if (!webhookUrl) {
      return { status: 'missing-webhook' };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '✅ JobFlow test reminder notification.',
        }),
      });

      if (!response.ok) {
        return { status: 'failed', error: `Request failed with status ${response.status}` };
      }

      return { status: 'sent' };
    } catch (error) {
      return { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const discordNotificationService = new DiscordNotificationService();
