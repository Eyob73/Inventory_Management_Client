import { Injectable, signal, computed } from '@angular/core';
import { AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSignal = signal<AppNotification[]>([
    {
      id: '1',
      title: 'Low Stock Alert',
      message: 'iPhone 15 Pro stock is below threshold (2 units remaining)',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
      read: false,
      type: 'warning',
      icon: 'warning',
      link: '/inventory',
    },
    {
      id: '2',
      title: 'New Order Received',
      message: 'Order #ORD-8492 placed by Acma Logistics',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
      read: false,
      type: 'info',
      icon: 'shopping_bag',
      link: '/sales',
    },
    {
      id: '3',
      title: 'Shipment Delivered',
      message: 'Supplier TechCorp delivered 50 units of Dell XPS 15',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      type: 'success',
      icon: 'check_circle',
      link: '/purchases',
    },
  ]);

  readonly notifications = this.notificationsSignal.asReadonly();

  readonly unreadCount = computed(() => {
    return this.notificationsSignal().filter((n) => !n.read).length;
  });

  markAsRead(id: string): void {
    this.notificationsSignal.update((items) =>
      items.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  markAllAsRead(): void {
    this.notificationsSignal.update((items) =>
      items.map((n) => ({ ...n, read: true }))
    );
  }

  removeNotification(id: string): void {
    this.notificationsSignal.update((items) =>
      items.filter((n) => n.id !== id)
    );
  }

  clearAll(): void {
    this.notificationsSignal.set([]);
  }

  addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: AppNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    this.notificationsSignal.update((items) => [newNotification, ...items]);
  }
}
