package com.proyecto.diego.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.proyecto.diego.entity.Product;

import jakarta.persistence.LockModeType;

public interface ProductsRepository extends JpaRepository <Product, Long>{
    
    // Para la regla de negocio: no borrar categoría con productos asociados
    boolean existsByCategoryId(Long categoryId);

    // Bloquea la fila del producto hasta que termine la transacción: si dos
    // cajeros cobran a la vez la última unidad, el segundo espera y ve el stock real.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
