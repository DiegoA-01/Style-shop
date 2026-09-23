import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },

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

  {
    path: 'products',
    title: 'Productos · Catálogo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/product-list/product-list').then(m => m.ProductList),
  },
  {
    path: 'products/new',
    title: 'Nuevo producto',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/product-form/product-form').then(m => m.ProductForm),
  },
  {
    path: 'products/:id/edit',
    title: 'Editar producto',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/product-form/product-form').then(m => m.ProductForm),
  },

  {
    path: 'categories',
    title: 'Categorías · Catálogo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/category-list/category-list').then(m => m.CategoryList),
  },
  {
    path: 'categories/new',
    title: 'Nueva categoría',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/category-form/category-form').then(m => m.CategoryForm),
  },
  {
    path: 'categories/:id/edit',
    title: 'Editar categoría',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/category-form/category-form').then(m => m.CategoryForm),
  },

  { path: '**', redirectTo: 'products' },
];
