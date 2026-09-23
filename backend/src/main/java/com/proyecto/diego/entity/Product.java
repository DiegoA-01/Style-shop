package com.proyecto.diego.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table (name = "products")
@Getter
@Setter 
@NoArgsConstructor 
@AllArgsConstructor
public class Product {
    
    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    @Column (nullable = false, length = 100)
    private String name;

    @Column (length = 500)
    private String description;

    @Column (nullable = false, precision = 10, scale = 3)
    private  BigDecimal price;

    @Column (nullable = false)
    private Integer stock;

    @ManyToOne (fetch = FetchType.LAZY)
    @JoinColumn (name = "category_id", nullable = false)
    private  Category category;

    @Column (name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column (name = "image_url", length = 500)
    private  String imageUrl;

    /**
     * Callback de ciclo de vida de JPA.
     * Se ejecuta automáticamente justo antes del INSERT,
     * asignando la fecha/hora de creación en el servidor
     * (nunca depende de lo que envíe el cliente).
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    } 
}
