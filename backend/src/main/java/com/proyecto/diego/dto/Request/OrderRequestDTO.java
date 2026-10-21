package com.proyecto.diego.dto.Request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequestDTO {

    @NotBlank(message = "El nombre es obligatorio.")
    private String customerName;

    @NotBlank(message = "El teléfono es obligatorio.")
    private String customerPhone;

    @NotEmpty(message = "El pedido debe tener al menos un producto.")
    @Valid
    private List<OrderItemRequestDTO> items;
}
