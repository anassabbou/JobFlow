export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    deadlineReminders: boolean;
    statusUpdates: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    reminderDays: number; // Days before deadline to remind
  };
  discordNotifications: {
    enabled: boolean;
    webhookUrl: string;
  };
  preferences: {
    defaultView: 'grid' | 'list';
    sortBy: 'date' | 'company' | 'status';
    sortOrder: 'asc' | 'desc';
    showStats: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
