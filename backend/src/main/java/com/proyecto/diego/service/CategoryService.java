package com.proyecto.diego.service;

import com.proyecto.diego.repository.ProductsRepository;
import java.util.List;

import org.springframework.stereotype.Service;

import com.proyecto.diego.dto.Request.CategoryRequestDTO;
import com.proyecto.diego.dto.Response.CategoryResponseDTO;
import com.proyecto.diego.entity.Category;
import com.proyecto.diego.repository.CategoryRespository;

import lombok.RequiredArgsConstructor;

@Service 
@RequiredArgsConstructor 
public class CategoryService {
    
    private final ProductsRepository productsRepository;
    private final CategoryRespository categoryRespository;


    
    public CategoryResponseDTO createCategory(CategoryRequestDTO request){

        if (categoryRespository.existsByName(request.getName())) {
            throw new RuntimeException("El nombre ya existe ");
        }

        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());

        Category saveCategory = categoryRespository.save(category);
        
        return toResponse(saveCategory);
    }

    public List<CategoryResponseDTO> lisCategory(){
        return  categoryRespository.findAll().stream().map(this:: toResponse).toList();
    } 

    public CategoryResponseDTO showId(Long id){

        Category category = categoryRespository.findById(id).orElseThrow(()-> new RuntimeException("Categoria no encontrada."));

        return toResponse(category);
    }

    public CategoryResponseDTO putCategoryId(long id, CategoryRequestDTO resques){

        Category category = categoryRespository.findById(id).orElseThrow(()-> new RuntimeException("Categoria no encontrada"));

        category.setName(resques.getName());
        category.setDescription(resques.getDescription());

        Category saveCategory = categoryRespository.save(category);

        return toResponse(saveCategory);
    }

    public void  deleteCategoryId (Long id){
        categoryRespository.findById(id).orElseThrow(()-> new RuntimeException("Categoria con id" + id + " no encontrada"));

        if (productsRepository.existsByCategoryId(id)) {
            throw new RuntimeException("no se puede eliminar: la categoria tiene productos asociados");
        }

        categoryRespository.deleteById(id);

    }


    public CategoryResponseDTO toResponse(Category category){
        return CategoryResponseDTO.builder()
            .id(category.getId())
            .name(category.getName())
            .description(category.getDescription())
            .build();
    }
}
