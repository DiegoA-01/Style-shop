package com.proyecto.diego.entity;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity 
@Table(name = "category")
@Getter
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
public class Category {
    
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;
    

    @Column (nullable = false, unique = true)
    private String name;

    @Column(name = "descripcion",length = 255)
    private  String description;

    @OneToMany (mappedBy = "category", cascade = CascadeType.PERSIST)
    private List<Product> products;
}
