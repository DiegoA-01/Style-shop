import { Routes } from '@angular/router';
import { staffGuard } from './guards/staff.guard';
import { adminGuard } from './guards/admin.guard';
import { sellerGuard } from './guards/seller.guard';
import { homeGuard } from './guards/home.guard';

export const routes: Routes = [
  // El super admin no ve la landing: homeGuard lo lleva a su panel.
  {
    path: '',
    title: 'Style Shop',
    canActivate: [homeGuard],
    loadComponent: () =>
      import('./pages/home/home').then(m => m.Home),
  },

  // Panel del super admin: ventas del día, gráficas, productos y equipo.
  {
    path: 'admin',
    title: 'Panel · Style Shop',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/admin-dashboard').then(m => m.AdminDashboard),
  },

  {
    path: 'login',
    title: 'Iniciar sesión · Catálogo',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login),
  },
  {
    path: 'register',
    title: 'Crear cuenta · Catálogo',
    loadComponent: () =>
      import('./pages/register/register').then(m => m.Register),
  },

  // Catálogo público: cualquiera puede verlo sin cuenta (el backend ya
  // permite GET /product y /category sin token).
  {
    path: 'products',
    title: 'Productos · Catálogo',
    loadComponent: () =>
      import('./pages/product-list/product-list').then(m => m.ProductList),
  },
  {
    path: 'products/new',
    title: 'Nuevo producto',
    canActivate: [staffGuard],
    loadComponent: () =>
      import('./pages/product-form/product-form').then(m => m.ProductForm),
  },
  {
    path: 'products/:id/edit',
    title: 'Editar producto',
    canActivate: [staffGuard],
    loadComponent: () =>
      import('./pages/product-form/product-form').then(m => m.ProductForm),
  },

  {
    path: 'categories',
    title: 'Categorías · Catálogo',
    loadComponent: () =>
      import('./pages/category-list/category-list').then(m => m.CategoryList),
  },
  {
    path: 'categories/new',
    title: 'Nueva categoría',
    canActivate: [staffGuard],
    loadComponent: () =>
      import('./pages/category-form/category-form').then(m => m.CategoryForm),
  },
  {
    path: 'categories/:id/edit',
    title: 'Editar categoría',
    canActivate: [staffGuard],
    loadComponent: () =>
      import('./pages/category-form/category-form').then(m => m.CategoryForm),
  },

  // Historial de pedidos: quien maneja ventas (CAJERO o SUPER_ADMIN).
  {
    path: 'orders',
    title: 'Pedidos · Catálogo',
    canActivate: [sellerGuard],
    loadComponent: () =>
      import('./pages/order-list/order-list').then(m => m.OrderList),
  },

  // Gestión de cuentas: exclusiva del super admin.
  {
    path: 'users',
    title: 'Usuarios · Catálogo',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/user-list/user-list').then(m => m.UserList),
  },

  { path: '**', redirectTo: '' },
];
