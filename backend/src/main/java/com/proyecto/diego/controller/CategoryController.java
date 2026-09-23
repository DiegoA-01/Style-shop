package com.proyecto.diego.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.diego.dto.Request.CategoryRequestDTO;
import com.proyecto.diego.dto.Response.CategoryResponseDTO;
import com.proyecto.diego.dto.Response.GlobalResponseDTO;
import com.proyecto.diego.service.CategoryService;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController 
@RequestMapping ("/category")
@RequiredArgsConstructor 
@Validated 
public class CategoryController {
    
    private final CategoryService categoryService;

    @PostMapping 
    public ResponseEntity<GlobalResponseDTO<CategoryResponseDTO>> createCategory(@Valid @RequestBody CategoryRequestDTO request){

        CategoryResponseDTO response = categoryService.createCategory(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
            GlobalResponseDTO.<CategoryResponseDTO>builder()
                            .message("Categoria creado exitosamente")
                            .data(response)
                            .build()
        );
    }

    @GetMapping 
    public ResponseEntity<GlobalResponseDTO<List<CategoryResponseDTO>>> lisCategory(){
        List<CategoryResponseDTO> category = categoryService.lisCategory();

        return ResponseEntity.ok(
            GlobalResponseDTO.<List<CategoryResponseDTO>>builder()
                            .message("Lista de categoria obtenida correctamente")
                            .data(category)
                            .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<GlobalResponseDTO<CategoryResponseDTO>> showId(@PathVariable Long id){
        CategoryResponseDTO response = categoryService.showId(id);

        return ResponseEntity.ok(
            GlobalResponseDTO.<CategoryResponseDTO>builder()
                            .message("Categoria encontrado correctamente")
                            .data(response)
                            .build()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<GlobalResponseDTO<CategoryResponseDTO>> putCategoryId(@PathVariable Long id, @Valid @RequestBody CategoryRequestDTO request){
        CategoryResponseDTO category = categoryService.putCategoryId(id,request);

        return ResponseEntity.ok(
            GlobalResponseDTO.<CategoryResponseDTO>builder()
                            .message("Categoria actualizado correctamenete")
                            .data(category)
                            .build()   
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<GlobalResponseDTO<CategoryResponseDTO>> deleteCategoryId(@PathVariable Long id){
        categoryService.deleteCategoryId(id);

        return ResponseEntity.ok(
            GlobalResponseDTO.<CategoryResponseDTO>builder()
                            .message("Categoria eliminado correctamente")
                            .build()   
        );
    }
}
