package com.proyecto.diego.dto.Request;

import java.math.BigDecimal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data  
@NoArgsConstructor 
@AllArgsConstructor 
@Builder 
@Valid 
public class ProductRequestDTO {
    
    @NotBlank (message = "Tiene que tener nombre")
    private  String name;

    private  String description;

    @NotNull (message = "precio es obligatorio")
    @Positive (message = "El precio debe ser mayor a cero")
    private BigDecimal price;

    @NotNull (message = "El stock es obligatorio")
    @PositiveOrZero  (message = "El stock no puede ser negativo")
    private Integer stock;

    @NotNull (message = "La categoria es obligatoria")
    private Long categoryId;

    private String imageUrl;
}
