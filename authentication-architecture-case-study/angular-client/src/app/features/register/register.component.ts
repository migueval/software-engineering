import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  role = 'user';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  selectedLang = this.authService.selectedLang;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.name || !this.email || !this.password || !this.role) {
      this.errorMessage = this.selectedLang() === 'es' 
        ? 'Por favor, completa todos los campos.' 
        : 'Please fill in all fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log(`[RegisterComponent] Registrando usuario: ${this.email}`);

    this.authService.register(this.name, this.email, this.password, this.role).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || (this.selectedLang() === 'es' ? 'Registro exitoso.' : 'Registration successful.');
        
        // Redirigir al login tras 2 segundos para dar feedback visual
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || (this.selectedLang() === 'es' ? 'Error al registrar el usuario.' : 'Error registering user.');
      }
    });
  }
}
