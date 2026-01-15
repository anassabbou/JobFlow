import { UserSettings } from '../types/Settings';

type EmailNotificationResult =
  | { status: 'disabled' }
  | { status: 'missing-receiver' }
  | { status: 'mailto' }
  | { status: 'sent' }
  | { status: 'failed'; error: string };

class EmailNotificationService {
  private getApiUrl(settings: UserSettings['emailNotifications']): string {
    return settings.apiUrl || import.meta.env.VITE_EMAIL_API_URL || '';
  }

  async sendTestEmail(settings: UserSettings['emailNotifications']): Promise<EmailNotificationResult> {
    if (!settings.enabled) {
      return { status: 'disabled' };
    }

    if (!settings.receiverEmail) {
      return { status: 'missing-receiver' };
    }

    const apiUrl = this.getApiUrl(settings);
    if (!apiUrl) {
      const subject = encodeURIComponent('JobFlow test email');
      const body = encodeURIComponent('This is a test reminder from JobFlow.');
      window.open(`mailto:${settings.receiverEmail}?subject=${subject}&body=${body}`, '_blank');
      return { status: 'mailto' };
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: settings.authToken ? `Bearer ${settings.authToken}` : '',
        },
        body: JSON.stringify({
          to: settings.receiverEmail,
          from: settings.senderEmail,
          subject: 'JobFlow test email',
          text: 'This is a test reminder from JobFlow.',
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

export const emailNotificationService = new EmailNotificationService();
