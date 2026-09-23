//Representa la categoría tal como la devuelve el backend (CategoryResponseDTO)
export interface Category {
    id: number;
    name: string;
    description?: string;
}

// Representa lo que se envía al crear/editar (CategoryRequestDTO)
export interface CategoryRequest {
    name: string;
    description?: string;
}