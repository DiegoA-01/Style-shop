package com.proyecto.diego.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.proyecto.diego.dto.Request.ProductRequestDTO;
import com.proyecto.diego.dto.Response.CategorySummaryDTO;
import com.proyecto.diego.dto.Response.ProductResponseDTO;
import com.proyecto.diego.entity.Category;
import com.proyecto.diego.entity.Product;
import com.proyecto.diego.repository.CategoryRespository;
import com.proyecto.diego.repository.ProductsRepository;

import lombok.RequiredArgsConstructor;

@Service 
@RequiredArgsConstructor 
public class ProductService {
    
    private final ProductsRepository productsRepository;
    private  final CategoryRespository categoryRespository;

    @Value ("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.base-url}")
    private String baseUrl;

    public String uploadImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("El archivo está vacío");
        }

        try {
            // Crea la carpeta si no existe todavía
            Path directory = Paths.get(uploadDir);
            if (!Files.exists(directory)) {
                Files.createDirectories(directory);
            }

            // Genera un nombre único para evitar que dos fotos con el mismo
            // nombre original se sobreescriban entre sí
            String extension = obtenerExtension(file.getOriginalFilename());
            String nombreArchivo = UUID.randomUUID().toString() + extension;

            Path destino = directory.resolve(nombreArchivo);
            Files.copy(file.getInputStream(), destino);

            // Devuelve la URL pública completa, lista para guardar en el producto
            return baseUrl + "/uploads/products/" + nombreArchivo;

        } catch (IOException e) {
            throw new RuntimeException("Error al guardar la imagen: " + e.getMessage());
        }
    }

    private String obtenerExtension(String nombreOriginal) {
        if (nombreOriginal == null || !nombreOriginal.contains(".")) {
            return ".jpg";
        }
        return nombreOriginal.substring(nombreOriginal.lastIndexOf("."));
    }


    public ProductResponseDTO createProduct(ProductRequestDTO request){
        Category category = categoryRespository.findById(request.getCategoryId()).orElseThrow(()-> new RuntimeException("Categoria no encontrada"));

        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setCategory(category);
        product.setImageUrl(request.getImageUrl());

        Product saveProduct = productsRepository.save(product);

        return toResponse(saveProduct);
        
    }

    public List<ProductResponseDTO> listProdcut(){
        return  productsRepository.findAll().stream().map(this :: toResponse).toList();
    }

    public ProductResponseDTO showId(Long id){
        Product product = productsRepository.findById(id).orElseThrow(()-> new  RuntimeException("Producto no encontrado"));

        return toResponse(product);
    }

    public ProductResponseDTO updateId(Long id, ProductRequestDTO request){
        Product product = productsRepository.findById(id).orElseThrow(()-> new  RuntimeException("Producto no encontrado"));

        Category category = categoryRespository.findById(request.getCategoryId()).orElseThrow(()-> new RuntimeException("Categoria no encontrada"));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setCategory(category);
        product.setImageUrl(request.getImageUrl());

        Product saveproduct = productsRepository.save(product);

        return toResponse(saveproduct);
    }

    public void deleteId(Long id){
        productsRepository.findById(id).orElseThrow(()-> new RuntimeException("Producto no encontrado"));

        productsRepository.deleteById(id);
    }



    public ProductResponseDTO toResponse(Product product){
        return ProductResponseDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stock(product.getStock())
                .createdAt(product.getCreatedAt())
                .imageUrl(product.getImageUrl())
                .category(
                    CategorySummaryDTO.builder()
                            .id(product.getCategory().getId())
                            .name(product.getCategory().getName())
                            .build()
                )   
                .build();
    }
}
