package com.proyecto.diego.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.diego.entity.Product;

public interface ProductsRepository extends JpaRepository <Product, Long>{
    
    // Para la regla de negocio: no borrar categoría con productos asociados
    boolean existsByCategoryId(Long categoryId);

    
}
