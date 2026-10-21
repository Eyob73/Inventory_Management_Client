import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth';
import { LanguageService } from './language.service';
import { environment } from '../../environments/environment';
import { AuthResponse } from '../models/auth.model';

describe('AuthService - Authentication Lifecycle and Token Persistence', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/Auth`;

  // Create mock JWT helper
  function createMockJwt(expiresInSeconds: number): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = btoa(JSON.stringify({
      nameid: 'user-123',
      email: 'test@example.com',
      role: 'Staff',
      FirstName: 'John',
      LastName: 'Doe',
      exp: exp
    }));
    return `${header}.${payload}.mockSignature`;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: LanguageService,
          useValue: {
            initLanguage: () => {},
            getCurrentLanguage: () => 'en',
            getSupportedLanguages: () => ['en']
          }
        }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
    if (service) {
      service.cancelTokenRefresh();
    }
    localStorage.clear();
  });

  it('should store and retrieve both access and refresh tokens', () => {
    const mockToken = createMockJwt(900); // 15 mins
    service.setTokens(mockToken, 'refresh-token-xyz');

    expect(service.getToken()).toBe(mockToken);
    expect(service.getRefreshToken()).toBe('refresh-token-xyz');
  });

  it('should accurately detect expired and active tokens', () => {
    const activeToken = createMockJwt(900); // 15 mins in future
    const expiredToken = createMockJwt(-60); // 1 min in past
    const expiringSoonToken = createMockJwt(15); // 15s in future (within 30s buffer)

    expect(service.isTokenExpired(activeToken)).toBe(false);
    expect(service.isTokenExpired(expiredToken)).toBe(true);
    expect(service.isTokenExpired(expiringSoonToken)).toBe(true);
  });

  it('should store tokens and schedule refresh on successful login', () => {
    const mockToken = createMockJwt(900);
    const mockResponse: AuthResponse = {
      message: 'Login successful.',
      accessToken: mockToken,
      refreshToken: 'new-refresh-token'
    };

    service.login({ email: 'test@example.com', password: 'Password123!' }).subscribe((res) => {
      expect(res.accessToken).toBe(mockToken);
      expect(service.getToken()).toBe(mockToken);
      expect(service.getRefreshToken()).toBe('new-refresh-token');
    });

    const req = httpMock.expectOne(`${baseUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush(mockResponse);
  });

  it('should send stored refresh token and withCredentials on refresh request', () => {
    service.setTokens(createMockJwt(60), 'active-refresh-token');

    const newToken = createMockJwt(900);
    const refreshResponse: AuthResponse = {
      message: 'Refreshed',
      accessToken: newToken,
      refreshToken: 'rotated-refresh-token'
    };

    service.refresh().subscribe((res) => {
      expect(res.accessToken).toBe(newToken);
      expect(service.getToken()).toBe(newToken);
      expect(service.getRefreshToken()).toBe('rotated-refresh-token');
    });

    const req = httpMock.expectOne(`${baseUrl}/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({ refreshToken: 'active-refresh-token' });
    req.flush(refreshResponse);
  });

  it('should remove all tokens and clear current user on logout', () => {
    service.setTokens(createMockJwt(900), 'refresh-token-to-revoke');

    service.logout().subscribe(() => {
      expect(service.getToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
      expect(service.currentUser()).toBeNull();
    });

    const req = httpMock.expectOne(`${baseUrl}/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({ refreshToken: 'refresh-token-to-revoke' });
    req.flush({});
  });

  it('should decode current user and populate user details correctly', () => {
    const mockToken = createMockJwt(900);
    service.setTokens(mockToken);

    service.getCurrentUser().subscribe((user) => {
      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
      expect(user?.firstName).toBe('John');
      expect(user?.lastName).toBe('Doe');
      expect(user?.roles).toEqual(['Staff']);
    });
  });
});
