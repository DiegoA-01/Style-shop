import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { LoadingService } from './shared/loading.service';
import { ToastContainer } from './shared/toast-container';

@Component({
  selector: 'app-root',
  // RouterOutlet — necesario para que <router-outlet /> funcione en el HTML
  // (el "hueco" donde el router dibuja la pantalla activa).
  // RouterLink — para que los <a routerLink="/products"> funcionen sin recargar la página.
  // RouterLinkActive — para resaltar visualmente el enlace de la sección donde estás parado.
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Catalogo de Ropa');
  protected authService = inject(AuthService);
  protected loadingService = inject(LoadingService);

  cerrarSesion(): void {
    this.authService.logout();
  }
}
