// Versión resumida de la categoría, tal como viene anidada en ProductResponseDTO
export interface CategorySummary {
    id: number;
    name: string;
}

// Lo que el backend devuelve (ProductResponseDTO)
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  createdAt: string; // LocalDateTime llega como string ISO desde el backend
  category: CategorySummary;
  imageUrl?: string;
}

// Lo que se envía al crear/editar (ProductRequestDTO)
export interface ProductRequest {
    name: string;
    description?: string;
    price: number;
    stock: number;
    categoryId: number;
    imageUrl?: string;
}