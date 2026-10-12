import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OfflineComponent } from './offline';
import { ConnectionService } from '../../services/connection.service';
import { signal } from '@angular/core';

describe('OfflineComponent', () => {
  let component: OfflineComponent;
  let fixture: ComponentFixture<OfflineComponent>;
  let mockConnectionService: Partial<ConnectionService>;

  beforeEach(async () => {
    mockConnectionService = {
      status: signal('offline'),
      isChecking: signal(false),
      isOffline: signal(true) as any,
      isApiUnreachable: signal(false) as any,
      isDisconnected: signal(true) as any,
      diagnostics: signal({
        browserOnline: false,
        apiReachable: false,
        lastChecked: null,
        lastOnline: null,
        failureCount: 1,
      }) as any,
      checkConnectivity: async () => false,
    };

    await TestBed.configureTestingModule({
      imports: [OfflineComponent],
      providers: [
        { provide: ConnectionService, useValue: mockConnectionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OfflineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the offline component', () => {
    expect(component).toBeTruthy();
  });

  it('should show "You\'re Offline" title by default when offline', () => {
    expect(component['heading']()).toBe("You're Offline");
  });

  it('should toggle troubleshooting accordion open and closed', () => {
    expect(component['showTroubleshooting']()).toBe(false);
    component.toggleTroubleshooting();
    expect(component['showTroubleshooting']()).toBe(true);
    component.toggleTroubleshooting();
    expect(component['showTroubleshooting']()).toBe(false);
  });
});
