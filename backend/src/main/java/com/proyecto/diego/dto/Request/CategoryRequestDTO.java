package com.proyecto.diego.dto.Request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder 
@Valid 
public class CategoryRequestDTO {
    
    @NotBlank  (message = "El nombre es obligatorio. ")
    @Size (min = 2, max = 50, message = "El nombre debe tener entre 2 a 50 caracteres")
    private String name;

    @Size (max = 255, message = "La descripcion no puede tener mas de 255 caracteres")
    private String description; 
}

