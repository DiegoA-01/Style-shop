package com.proyecto.diego.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration 
public class WebConfig implements WebMvcConfigurer {
    
    @Value ("${app.upload.dir}")
    private String uploadDir;

    @Override 
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cualquier petición a /uploads/products/algo.jpg
        // se resuelve leyendo el archivo físico desde la carpeta configurada.
        registry.addResourceHandler("/uploads/products/**")
            .addResourceLocations("file:" + uploadDir + "/");
    }
}
