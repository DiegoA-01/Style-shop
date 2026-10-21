package com.proyecto.diego.dto.Request;

import java.math.BigDecimal;
import java.util.List;

import com.proyecto.diego.entity.PaymentMethod;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Venta de mostrador: el cajero la arma y la cobra en un solo paso.
// El cliente es opcional (en mostrador muchas veces no se pide).
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CounterSaleRequestDTO {

    @Size(max = 100, message = "El nombre no puede superar 100 caracteres.")
    private String customerName;

    @Size(max = 30, message = "El teléfono no puede superar 30 caracteres.")
    private String customerPhone;

    @NotEmpty(message = "La venta debe tener al menos un producto.")
    @Valid
    private List<OrderItemRequestDTO> items;

    @NotNull(message = "El método de pago es obligatorio.")
    private PaymentMethod paymentMethod;

    @PositiveOrZero(message = "El monto recibido no puede ser negativo.")
    private BigDecimal amountReceived;
}
