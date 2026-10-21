import { Component, HostListener, computed, inject, signal, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { UserAccount } from '../../models/user.model';
import { Role } from '../../models/auth.model';
import { UserForm } from '../user-form/user-form';
import { ToastService } from '../../shared/toast.service';
import { AuthService } from '../../services/auth.service';
import { RevealDirective } from '../../shared/reveal.directive';

@Component({
  imports: [UserForm, RevealDirective],
  styleUrl: './user-list.css',
  templateUrl: './user-list.html',
})
export class UserList implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  users = signal<UserAccount[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  usuarioAEliminar = signal<number | null>(null);
  mostrarFormulario = signal(false);
  // Equipo = cuentas de personal; clientes = registro público (USUARIO).
  vista = signal<'equipo' | 'clientes'>('equipo');
  equipo = computed(() => this.users().filter(u => u.role !== 'USUARIO'));
  clientes = computed(() => this.users().filter(u => u.role === 'USUARIO'));
  visibles = computed(() => (this.vista() === 'equipo' ? this.equipo() : this.clientes()));

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.cargando.set(false);
      }
    });
  }

  abrirFormulario(): void {
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
  }

  usuarioGuardado(): void {
    this.mostrarFormulario.set(false);
    this.cargarUsuarios();
  }

  roleLabel(role: Role): string {
    return { SUPER_ADMIN: 'Super admin', TRABAJADOR: 'Empleado', CAJERO: 'Cajero', USUARIO: 'Cliente' }[role];
  }

  esYo(user: UserAccount): boolean {
    return user.username === this.authService.currentUser();
  }

  // No se puede eliminar la propia cuenta desde aquí: evita que un admin
  // se quede sin sesión válida a mitad de la gestión de usuarios.
  puedeEliminar(user: UserAccount): boolean {
    return user.username !== this.authService.currentUser();
  }

  eliminar(id: number): void {
    this.usuarioAEliminar.set(id);
  }

  confirmarEliminacion(): void {
    const id = this.usuarioAEliminar();

    if (id === null) {
      return;
    }

    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.users.update(lista => lista.filter(u => u.id !== id));
        this.usuarioAEliminar.set(null);
        this.toastService.success('Cuenta eliminada');
      },
      error: (err) => {
        this.toastService.error(err.message);
        this.usuarioAEliminar.set(null);
      }
    });
  }

  cancelarEliminacion(): void {
    this.usuarioAEliminar.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.usuarioAEliminar() !== null) {
      this.cancelarEliminacion();
    } else if (this.mostrarFormulario()) {
      this.cerrarFormulario();
    }
  }
}
