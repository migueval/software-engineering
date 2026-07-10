import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface User {
  name: string;
  email: string;
  role: string;
}

export interface RegisterResponse {
  status: string;
  message: string;
}

export interface LoginResponse {
  status: string;
  stepToken?: string;
  message: string;
}

export interface VerifyOtpResponse {
  status: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Configuración de endpoints (Monolito por defecto, configurable)
  private currentBackendUrl = 'http://localhost:3000/api'; // Puerto 3000 para Monolito, 3001 para Gateway
  
  // Estado reactivo usando Angular Signals
  private tokenSignal = signal<string | null>(this.getStoredToken());
  private currentUserSignal = signal<User | null>(this.getStoredUser());
  private stepTokenSignal = signal<string | null>(null);
  private langSignal = signal<'es' | 'en'>(this.getStoredLang());
  
  // Getters reactivos públicos
  token = computed(() => this.tokenSignal());
  currentUser = computed(() => this.currentUserSignal());
  stepToken = computed(() => this.stepTokenSignal());
  selectedLang = computed(() => this.langSignal());

  setLanguage(lang: 'es' | 'en') {
    this.langSignal.set(lang);
    localStorage.setItem('preferred_lang', lang);
    console.log(`[AuthService] Idioma global cambiado a: ${lang}`);
  }

  private getStoredLang(): 'es' | 'en' {
    const stored = localStorage.getItem('preferred_lang');
    return (stored === 'es' || stored === 'en') ? stored : 'es';
  }
  
  // Para pruebas sin servidor
  private mockUsers: Array<User & { passwordHash: string }> = [
    { name: 'Miguel Valdez', email: 'migue@example.com', role: 'admin', passwordHash: '123456' }
  ];
  
  private currentMockOtp: string | null = null;

  constructor(private http: HttpClient) {
    // Restaurar sesión desde el LocalStorage
    this.restoreSession();
  }

  // Establecer url del backend (para cambiar entre Monolito y Microservicios)
  setBackend(type: 'monolith' | 'microservices') {
    this.currentBackendUrl = type === 'monolith' 
      ? 'http://localhost:3000/api' 
      : 'http://localhost:3001/api';
    console.log(`[AuthService] Cambiado backend a: ${this.currentBackendUrl}`);
  }

  getBackendUrl(): string {
    return this.currentBackendUrl;
  }

  // REGISTRO
  register(name: string, email: string, password: string, role: string): Observable<RegisterResponse> {
    const payload = { name, email, password, role, lang: this.selectedLang() };
    console.log(`[AuthService] Petición POST a ${this.currentBackendUrl}/auth/register`, payload);
    
    return this.http.post<RegisterResponse>(`${this.currentBackendUrl}/auth/register`, payload).pipe(
      catchError((err) => {
        if (err.status !== 0) {
          // El servidor está en línea y devolvió un error de validación/negocio real
          return throwError(() => new Error(err.error?.message || 'Error al registrar el usuario.'));
        }
        // Fallback a simulación solo si el servidor está apagado (err.status === 0)
        console.warn('[AuthService] Servidor no disponible. Simulando registro local...');
        const userExists = this.mockUsers.some(u => u.email === email);
        if (userExists) {
          return throwError(() => new Error('El usuario ya existe.'));
        }
        this.mockUsers.push({ name, email, role, passwordHash: password });
        return of({ status: 'SUCCESS', message: 'Usuario registrado localmente (Simulado).' });
      })
    );
  }

  // LOGIN (PASO 1)
  login(email: string, password: string): Observable<LoginResponse> {
    const payload = { email, password, lang: this.selectedLang() };
    console.log(`[AuthService] Petición POST a ${this.currentBackendUrl}/auth/login`, payload);
    
    return this.http.post<LoginResponse>(`${this.currentBackendUrl}/auth/login`, payload).pipe(
      tap(res => {
        if (res.stepToken) {
          this.stepTokenSignal.set(res.stepToken);
        }
      }),
      catchError((err) => {
        if (err.status !== 0) {
          // El servidor respondió con error real (ej: 401 Credenciales incorrectas)
          return throwError(() => new Error(err.error?.message || 'Credenciales incorrectas.'));
        }
        // Fallback a simulación
        console.warn('[AuthService] Servidor no disponible. Simulando verificación de credenciales local...');
        const matchedUser = this.mockUsers.find(u => u.email === email && u.passwordHash === password);
        
        if (!matchedUser) {
          return throwError(() => new Error('Credenciales incorrectas (Email/Contraseña).'));
        }

        // Generar un stepToken simulado
        const simStepToken = 'sim-step-token-' + Math.random().toString(36).substr(2, 9);
        this.stepTokenSignal.set(simStepToken);
        
        // Generar un OTP simulado y mostrarlo por alerta
        this.currentMockOtp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Simular envío de notificación
        setTimeout(() => {
          alert(`[SIMULACIÓN OTP] Tu código de seguridad enviado vía SMS/Email es: ${this.currentMockOtp}`);
          console.log(`%c[OTP GENERADO]: ${this.currentMockOtp} (Válido por 180s)`, 'color: #10b981; font-weight: bold; font-size: 14px;');
        }, 800);

        return of({ 
          status: 'OTP_REQUIRED', 
          stepToken: simStepToken, 
          message: 'Código OTP generado (Simulado en Consola/Alerta)' 
        });
      })
    );
  }

  // VERIFICAR OTP (PASO 2)
  verifyOtp(code: string, stepToken: string): Observable<VerifyOtpResponse> {
    const payload = { code, stepToken };
    console.log(`[AuthService] Petición POST a ${this.currentBackendUrl}/auth/verify-otp`, payload);
    
    return this.http.post<VerifyOtpResponse>(`${this.currentBackendUrl}/auth/verify-otp`, payload).pipe(
      tap(res => {
        this.saveSession(res.token);
      }),
      catchError(err => {
        if (err.status !== 0) {
          // El servidor está en línea y arrojó código inválido/expirado
          return throwError(() => new Error(err.error?.message || 'Código OTP inválido o expirado.'));
        }
        // Fallback a simulación
        if (this.currentMockOtp && code === this.currentMockOtp && stepToken === this.stepToken()) {
          console.warn('[AuthService] Servidor no disponible. Simulando verificación de OTP exitosa...');
          
          // Buscar el usuario logueado en la simulación
          const userSim: User = { 
            name: 'Miguel Valdez', 
            email: 'migue@example.com', 
            role: 'admin' 
          };
          
          // Crear un token JWT mock estructurado correctamente con cabecera base64 válida
          const mockHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
          const mockPayload = btoa(JSON.stringify({
            sub: 'mock-id-123',
            email: userSim.email,
            role: userSim.role,
            name: userSim.name
          }));
          const mockJwt = `${mockHeader}.${mockPayload}.mock-signature`;
          this.saveSession(mockJwt);
          
          return of({ status: 'SUCCESS', token: mockJwt });
        }
        return throwError(() => new Error(err.message || 'Código OTP inválido o expirado.'));
      })
    );
  }

  // LOGOUT
  logout() {
    console.log('[AuthService] Cerrando sesión y borrando credenciales');
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.stepTokenSignal.set(null);
    this.currentMockOtp = null;
    
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_profile');
  }

  isAuthenticated(): boolean {
    return this.tokenSignal() !== null;
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  private saveSession(token: string) {
    this.tokenSignal.set(token);
    
    // Extraer payload del JWT (simulado o real)
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const user: User = {
          name: payload.name || 'Usuario',
          email: payload.email || '',
          role: payload.role || 'user'
        };
        this.currentUserSignal.set(user);
        localStorage.setItem('user_profile', JSON.stringify(user));
      }
    } catch (e) {
      console.error('Error decodificando token JWT:', e);
    }
    
    localStorage.setItem('jwt_token', token);
  }

  private restoreSession() {
    const token = localStorage.getItem('jwt_token');
    const userJson = localStorage.getItem('user_profile');
    if (token && userJson) {
      this.tokenSignal.set(token);
      this.currentUserSignal.set(JSON.parse(userJson));
    }
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  private getStoredUser(): User | null {
    const user = localStorage.getItem('user_profile');
    return user ? JSON.parse(user) : null;
  }
}
