import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  jwtToken = '';
  jwtHeaderJson = '';
  jwtPayloadJson = '';
  activeBackend = '';

  selectedLang = this.authService.selectedLang;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.user = this.authService.currentUser();
    this.jwtToken = this.authService.getToken() || '';
    this.activeBackend = this.authService.getBackendUrl();

    this.parseJwt();
  }

  parseJwt() {
    if (!this.jwtToken) return;

    try {
      const parts = this.jwtToken.split('.');
      if (parts.length >= 2) {
        // Decodificar Base64URL
        const header = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        
        this.jwtHeaderJson = JSON.stringify(JSON.parse(header), null, 2);
        this.jwtPayloadJson = JSON.stringify(JSON.parse(payload), null, 2);
      }
    } catch (e) {
      console.error('Error parseando JWT para la vista:', e);
      this.jwtHeaderJson = '{ "error": "Token no decodificable" }';
      this.jwtPayloadJson = '{ "error": "Token no decodificable" }';
    }
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
