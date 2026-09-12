import { Injectable, signal, computed, inject, OnDestroy, effect, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppNotification } from '../models/notification.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);

  private baseUrl = `${environment.apiUrl}/Notifications`;
  private hubConnection: signalR.HubConnection | null = null;

  private notificationsSignal = signal<AppNotification[]>([]);

  readonly notifications = this.notificationsSignal.asReadonly();

  readonly unreadCount = computed(() => {
    return this.notificationsSignal().filter((n) => !n.read).length;
  });

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadInitialData();
        this.startSignalRConnection();
      } else {
        this.stopSignalRConnection();
        this.clearAll();
      }
    });
  }

  private loadInitialData() {
    this.http.get<AppNotification[]>(this.baseUrl, { withCredentials: true }).subscribe({
      next: (data) => this.notificationsSignal.set(data),
      error: (err) => console.error('Error loading notifications', err)
    });
  }

  private startSignalRConnection() {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const hubUrl = environment.apiUrl.replace('/api', '') + '/hubs/notifications';

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.authService.getToken() || '',
        withCredentials: true
      })
      // .configureLogging(signalR.LogLevel.None)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveNotification', (notification: AppNotification) => {
      this.ngZone.run(() => {
        this.notificationsSignal.update(items => [notification, ...items]);
      });
    });

    this.hubConnection.start()
      .then(() => console.log('SignalR Notifications Connected'))
      .catch(err => console.error('Error starting SignalR connection', err));
  }

  private stopSignalRConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
    }
  }

  markAsRead(id: string): void {
    const notif = this.notificationsSignal().find(n => n.id === id);
    if (!notif || notif.read) return;

    this.notificationsSignal.update((items) =>
      items.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    this.http.put(`${this.baseUrl}/${id}/read`, {}, { withCredentials: true }).subscribe({
      error: (err) => {
        console.error('Error marking as read', err);
        this.notificationsSignal.update((items) =>
          items.map((n) => (n.id === id ? { ...n, read: false } : n))
        );
      }
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount() === 0) return;

    this.notificationsSignal.update((items) =>
      items.map((n) => ({ ...n, read: true }))
    );

    this.http.put(`${this.baseUrl}/read-all`, {}, { withCredentials: true }).subscribe({
      error: (err) => console.error('Error marking all as read', err)
    });
  }

  removeNotification(id: string): void {
    this.notificationsSignal.update((items) =>
      items.filter((n) => n.id !== id)
    );

    this.http.delete(`${this.baseUrl}/${id}`, { withCredentials: true }).subscribe({
      error: (err) => console.error('Error deleting notification', err)
    });
  }

  clearAll(): void {
    this.notificationsSignal.set([]);
  }

  ngOnDestroy() {
    this.stopSignalRConnection();
  }
}
