import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { AuthService } from './auth';
import { SwPush } from '@angular/service-worker';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { of } from 'rxjs';

describe('NotificationService - Push Unsubscription on Sign Out', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let mockSwPush: {
    isEnabled: boolean;
    subscription: any;
    requestSubscription: any;
    unsubscribe: any;
  };
  let currentUserSignal: any;

  beforeEach(() => {
    TestBed.resetTestingModule();

    // Start with an authenticated user
    currentUserSignal = signal<{ id: string; email: string; userName: string; roles: string[] } | null>({
      id: 'user-1',
      email: 'test@example.com',
      userName: 'test',
      roles: ['Staff']
    });

    mockSwPush = {
      isEnabled: true,
      subscription: of({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-abc',
        toJSON: () => ({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-abc',
          keys: { p256dh: 'mock-p256', auth: 'mock-auth' }
        })
      }),
      requestSubscription: vi.fn(),
      unsubscribe: vi.fn().mockResolvedValue(undefined)
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            currentUser: currentUserSignal,
            getToken: () => 'mock-jwt-token'
          }
        },
        {
          provide: SwPush,
          useValue: mockSwPush
        }
      ]
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock SignalR start and loadInitialData to keep tests focused on push unsubscription
    vi.spyOn(service as any, 'startSignalRConnection').mockImplementation(() => {});
    vi.spyOn(service as any, 'loadInitialData').mockImplementation(() => {});

    // Flush any pending GET calls if triggered
    const pendingGet = httpMock.match(`${environment.apiUrl}/Notifications`);
    pendingGet.forEach((r) => r.flush([]));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call backend unsubscribe and browser unsubscribe when unsubscribePush is invoked', async () => {
    const unsubPromise = service.unsubscribePush();

    // Allow promise ticks to reach the http request
    await new Promise((resolve) => setTimeout(resolve, 25));

    // Expect POST to /PushSubscriptions/unsubscribe
    const req = httpMock.expectOne(`${environment.apiUrl}/PushSubscriptions/unsubscribe`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body.endpoint).toBe('https://fcm.googleapis.com/fcm/send/test-endpoint-abc');

    req.flush({ message: 'Unsubscribed successfully.' });

    await unsubPromise;

    expect(mockSwPush.unsubscribe).toHaveBeenCalled();
  });

  it('should still unsubscribe from browser even if backend returns an error', async () => {
    const unsubPromise = service.unsubscribePush();

    await new Promise((resolve) => setTimeout(resolve, 25));

    const req = httpMock.expectOne(`${environment.apiUrl}/PushSubscriptions/unsubscribe`);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    await unsubPromise;

    // Even if server failed, the device push manager should be unsubscribed so no push notifications arrive
    expect(mockSwPush.unsubscribe).toHaveBeenCalled();
  });

  it('should complete gracefully without error when no active subscription exists', async () => {
    mockSwPush.subscription = of(null);

    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      vi.spyOn(navigator.serviceWorker, 'getRegistration').mockResolvedValue({
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(null)
        }
      } as any);
    }

    await service.unsubscribePush();
    httpMock.expectNone(`${environment.apiUrl}/PushSubscriptions/unsubscribe`);
  });

  it('should automatically trigger push unsubscription when user logs out (currentUser becomes null)', async () => {
    // Act: user logs out
    currentUserSignal.set(null);
    TestBed.flushEffects();

    await new Promise((resolve) => setTimeout(resolve, 25));

    const req = httpMock.expectOne(`${environment.apiUrl}/PushSubscriptions/unsubscribe`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Unsubscribed successfully.' });

    // Wait for the post-response unsubscription steps to complete
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(mockSwPush.unsubscribe).toHaveBeenCalled();
  });
});
