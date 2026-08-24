export type NotificationType = 'warning' | 'info' | 'success' | 'danger';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: NotificationType;
  icon: string;
  link?: string;
}
