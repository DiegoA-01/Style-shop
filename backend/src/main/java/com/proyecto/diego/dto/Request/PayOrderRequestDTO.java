package com.proyecto.diego.dto.Request;

import java.math.BigDecimal;

import com.proyecto.diego.entity.PaymentMethod;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Cobro de un pedido pendiente. amountReceived solo es obligatorio en
// efectivo (el servicio calcula el cambio); con tarjeta o transferencia se
// toma el total exacto.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayOrderRequestDTO {

    @NotNull(message = "El método de pago es obligatorio.")
    private PaymentMethod paymentMethod;

    @PositiveOrZero(message = "El monto recibido no puede ser negativo.")
    private BigDecimal amountReceived;
}
