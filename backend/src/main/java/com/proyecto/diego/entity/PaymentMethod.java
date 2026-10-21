package com.proyecto.diego.entity;

// Solo EFECTIVO maneja monto recibido y cambio; es el que cuadra la caja.
public enum PaymentMethod {
    EFECTIVO,
    TARJETA,
    TRANSFERENCIA
}
