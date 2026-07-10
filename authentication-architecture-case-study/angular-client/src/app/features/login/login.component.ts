import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  
  // Guardamos el estado del backend seleccionado para la UI
  selectedBackend = signal<'monolith' | 'microservices'>('monolith');

  // Control del idioma seleccionado para internacionalización (es/en)
  selectedLang = this.authService.selectedLang;

  constructor(private authService: AuthService, private router: Router) {
    // Sincronizar el selector con el estado del servicio
    const url = this.authService.getBackendUrl();
    if (url.includes('3001')) {
      this.selectedBackend.set('microservices');
    }
  }

  toggleBackend(type: 'monolith' | 'microservices') {
    this.selectedBackend.set(type);
    this.authService.setBackend(type);
  }

  toggleLang(lang: 'es' | 'en') {
    this.authService.setLanguage(lang);
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log(`[LoginComponent] Enviando credenciales para: ${this.email}`);

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.status === 'OTP_REQUIRED') {
          console.log('[LoginComponent] Login aprobado, requiere validación OTP de 2FA');
          // Redirigir a verificación OTP pasándole el correo
          this.router.navigate(['/verify-otp'], { queryParams: { email: this.email } });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Error al iniciar sesión.';
      }
    });
  }
}
