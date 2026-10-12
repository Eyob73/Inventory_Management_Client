import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { OfflineToastComponent } from './offline-toast';
import { ConnectionService } from '../../services/connection.service';

describe('OfflineToastComponent', () => {
  let component: OfflineToastComponent;
  let fixture: ComponentFixture<OfflineToastComponent>;
  let mockConnectionService: Partial<ConnectionService>;

  beforeEach(async () => {
    mockConnectionService = {
      status: signal('offline'),
      isChecking: signal(false),
      isOffline: signal(true) as any,
      isApiUnreachable: signal(false) as any,
      isDisconnected: signal(true) as any,
      checkConnectivity: async () => false,
    };

    await TestBed.configureTestingModule({
      imports: [OfflineToastComponent],
      providers: [
        provideRouter([]),
        { provide: ConnectionService, useValue: mockConnectionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OfflineToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the offline toast component', () => {
    expect(component).toBeTruthy();
  });

  it('should show "You\'re Offline" title when offline', () => {
    expect(component.title()).toBe("You're Offline");
    expect(component.isVisible()).toBe(true);
  });

  it('should dismiss the toast when dismiss() is called', () => {
    expect(component.isVisible()).toBe(true);
    component.dismiss();
    expect(component.isVisible()).toBe(false);
  });
});
