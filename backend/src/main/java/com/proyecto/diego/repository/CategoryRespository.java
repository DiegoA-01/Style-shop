package com.proyecto.diego.repository;

import java.util.Optional;
import com.proyecto.diego.entity.Category;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRespository extends JpaRepository <Category, Long> {

    /**
     * para validar el nombre unico al crear
     */
    boolean existsByName(String name);

    /**
     * Útil si necesitas buscar por nombre exacto en el servicio
     */
    Optional<Category> findByName(String name);
}
