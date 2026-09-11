export interface User {
  id: string;
  email: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[] | string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface AuthResponse {
  message: string;
  token?: string;
  accessToken?: string;
  user?: User;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  tenantId?: string;
}
