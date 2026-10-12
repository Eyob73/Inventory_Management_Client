import { TestBed } from '@angular/core/testing';
import { ConnectionService } from './connection.service';

describe('ConnectionService', () => {
  let service: ConnectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConnectionService],
    });
    service = TestBed.inject(ConnectionService);
  });

  it('should be created and have initial status defined', () => {
    expect(service).toBeTruthy();
    expect(service.status()).toBeDefined();
    expect(['online', 'offline', 'api_unreachable']).toContain(service.status());
  });

  it('should expose computed signals reflecting the current status', () => {
    service.status.set('online');
    expect(service.isOnline()).toBe(true);
    expect(service.isOffline()).toBe(false);
    expect(service.isApiUnreachable()).toBe(false);
    expect(service.isDisconnected()).toBe(false);

    service.status.set('offline');
    expect(service.isOnline()).toBe(false);
    expect(service.isOffline()).toBe(true);
    expect(service.isDisconnected()).toBe(true);

    service.status.set('api_unreachable');
    expect(service.isOnline()).toBe(false);
    expect(service.isApiUnreachable()).toBe(true);
    expect(service.isDisconnected()).toBe(true);
  });

  it('should correctly save, retrieve, and clear form drafts', () => {
    const testData = { name: 'Acme Corp', quantity: 42, active: true };
    service.saveFormDraft('test_form', testData);

    const retrieved = service.getFormDraft<typeof testData>('test_form');
    expect(retrieved).toEqual(testData);

    service.clearFormDraft('test_form');
    const cleared = service.getFormDraft('test_form');
    expect(cleared).toBeNull();
  });

  it('should ignore standard client HTTP errors in reportHttpError', () => {
    service.status.set('online');
    service.reportHttpError(400, '/api/products');
    expect(service.status()).toBe('online');

    service.reportHttpError(401, '/api/auth/profile');
    expect(service.status()).toBe('online');

    service.reportHttpError(404, '/api/orders/999');
    expect(service.status()).toBe('online');
  });

  it('should expose diagnostic properties for system transparency', () => {
    const diag = service.diagnostics();
    expect(diag).toBeDefined();
    expect(typeof diag.browserOnline).toBe('boolean');
    expect(typeof diag.apiReachable).toBe('boolean');
  });
});
