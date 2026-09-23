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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.proyecto.diego.dto.Request.ProductRequestDTO;
import com.proyecto.diego.dto.Response.GlobalResponseDTO;
import com.proyecto.diego.dto.Response.ProductResponseDTO;
import com.proyecto.diego.service.ProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController 
@RequestMapping ("/product")
@RequiredArgsConstructor 
@Validated 
public class ProductController {
    
    private final ProductService productService;

    @PostMapping("/upload-image")
    public ResponseEntity<GlobalResponseDTO<String>> uploadImage(
            @RequestParam("file") MultipartFile file) {

        String url = productService.uploadImage(file);

        return ResponseEntity.ok(
            GlobalResponseDTO.<String>builder()
                .message("Imagen subida con éxito")
                .data(url)
                .build()
        );
    }


    @PostMapping 
    public ResponseEntity<GlobalResponseDTO<ProductResponseDTO>> createProduct(@Valid @RequestBody ProductRequestDTO request){
        ProductResponseDTO response = productService.createProduct(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
            GlobalResponseDTO.<ProductResponseDTO>builder()
                            .message("Producto creado con exito")
                            .data(response)
                            .build()
        );
    }

    @GetMapping 
    public ResponseEntity<GlobalResponseDTO<List<ProductResponseDTO>>> listProdcut(){
        List<ProductResponseDTO> response = productService.listProdcut();

        return ResponseEntity.ok(
            GlobalResponseDTO.<List<ProductResponseDTO>>builder()
                            .message("Lista de productos encontrada correctamente.")
                            .data(response)
                            .build()
        );
    }

    @GetMapping ("/{id}")
    public ResponseEntity<GlobalResponseDTO<ProductResponseDTO>> showId(@PathVariable Long id){
        ProductResponseDTO response = productService.showId(id);

        return ResponseEntity.ok(
            GlobalResponseDTO.<ProductResponseDTO>builder()
                            .message("Producto encontrado correctamente")
                            .data(response)
                            .build()
        );       
    }

    @PutMapping("/{id}") 
    public ResponseEntity<GlobalResponseDTO<ProductResponseDTO>> updateId(@PathVariable Long id, @Valid @RequestBody  ProductRequestDTO request){
        ProductResponseDTO response = productService.updateId(id, request);

        return ResponseEntity.ok(
            GlobalResponseDTO.<ProductResponseDTO>builder()
                            .message("Porducto actualizado correctamente")
                            .data(response)
                            .build()
        );       
    }

    @DeleteMapping ("/{id}")
    public ResponseEntity<GlobalResponseDTO<ProductResponseDTO>> deleteId(@PathVariable Long id){
        productService.deleteId(id);

        return ResponseEntity.ok(
            GlobalResponseDTO.<ProductResponseDTO>builder()
                            .message("Producto eliminado correctamenete. ")
                            .build()
        ); 
    }
}