package com.proyecto.diego.entity;

/**
 * PENDIENTE: pedido web recién creado, todavía sin cobrar ni entregar.
 * PAGADA: el cajero cobró y despachó; es la única que cuenta como venta
 * en los reportes y la única que descuenta stock.
 * ANULADA: pedido pendiente que se canceló; no cuenta ni mueve stock.
 */
public enum OrderStatus {
    PENDIENTE,
    PAGADA,
    ANULADA
}
