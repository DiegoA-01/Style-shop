package com.proyecto.diego.dto.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data 
@AllArgsConstructor 
@NoArgsConstructor 
@Builder 
public class GlobalResponseDTO <T> {

    private String message;

    private T data;
    
}
