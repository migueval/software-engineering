import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.css']
})
export class OtpVerificationComponent implements OnInit, OnDestroy {
  code = '';
  email = '';
  errorMessage = '';
  isLoading = false;
  
  // Timer state
  timeLeft = 180; // 3 minutos en segundos
  timerString = '03:00';
  isTimerRunning = signal<boolean>(true);
  private timerInterval: any;

  selectedLang = this.authService.selectedLang;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Obtener correo del query parameter para mostrar en la interfaz
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || (this.selectedLang() === 'es' ? 'tu correo' : 'your email');
    });

    // Validar que exista el stepToken de login antes de continuar
    if (!this.authService.stepToken()) {
      console.warn('[OtpVerificationComponent] No se encontró stepToken de sesión activa.');
      this.errorMessage = this.selectedLang() === 'es' 
        ? 'Acceso inválido. Por favor inicia sesión primero.' 
        : 'Invalid access. Please sign in first.';
    }

    this.startTimer();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  startTimer() {
    this.stopTimer();
    this.timeLeft = 180;
    this.isTimerRunning.set(true);
    this.errorMessage = '';
    
    this.updateTimerString();
 
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateTimerString();
 
      if (this.timeLeft <= 0) {
        this.stopTimer();
        this.isTimerRunning.set(false);
        this.errorMessage = this.selectedLang() === 'es' 
          ? 'El código OTP ha expirado. Por favor, solicita uno nuevo.' 
          : 'OTP code has expired. Please request a new one.';
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  updateTimerString() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const secStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
    this.timerString = `${minStr}:${secStr}`;
  }

  onResendOtp() {
    if (this.isTimerRunning()) return;

    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('[OtpVerificationComponent] Reenviando código OTP...');
    
    // Simular llamada de login para generar nuevo OTP (para pruebas simuladas)
    this.authService.login(this.email, '123456').subscribe({
      next: () => {
        this.isLoading = false;
        this.startTimer();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || (this.selectedLang() === 'es' ? 'Error al reenviar el código.' : 'Error resending the code.');
      }
    });
  }

  onSubmit() {
    const stepToken = this.authService.stepToken();
    if (!stepToken) {
      this.errorMessage = this.selectedLang() === 'es' 
        ? 'Token de paso inválido. Inicia sesión nuevamente.' 
        : 'Invalid step token. Please sign in again.';
      return;
    }

    if (!this.code || this.code.length !== 6) {
      this.errorMessage = this.selectedLang() === 'es' 
        ? 'El código debe tener exactamente 6 dígitos.' 
        : 'The code must be exactly 6 digits.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log(`[OtpVerificationComponent] Enviando código OTP: ${this.code}`);

    this.authService.verifyOtp(this.code, stepToken).subscribe({
      next: () => {
        this.isLoading = false;
        console.log('[OtpVerificationComponent] OTP Verificado. Redirigiendo a Dashboard');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || (this.selectedLang() === 'es' ? 'El código ingresado es incorrecto.' : 'The code entered is incorrect.');
      }
    });
  }
}
