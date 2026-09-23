package com.proyecto.diego.dto.Response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder 
public class ProductResponseDTO {
    
    private Long id;

    private String name;

    private String description;

    private  BigDecimal price;

    private  Integer stock;

    private LocalDateTime createdAt; 

    private CategorySummaryDTO category;

    private String imageUrl;
}
