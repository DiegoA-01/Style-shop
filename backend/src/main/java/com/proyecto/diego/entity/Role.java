package com.proyecto.diego.entity;

public enum Role {
    // Puede todo: ventas, reportes, catálogo, caja y cuentas.
    SUPER_ADMIN,
    // "Empleado" en la interfaz: crea y edita productos y categorías, sube imágenes.
    TRABAJADOR,
    // Cobra y despacha pedidos web, registra ventas de mostrador y maneja la caja.
    CAJERO,
    // Rol por defecto del registro público (/auth/register): puede iniciar
    // sesión pero no tiene permisos para administrar nada.
    // Solo un SUPER_ADMIN puede crear cuentas de personal (ver /users).
    USUARIO
}
