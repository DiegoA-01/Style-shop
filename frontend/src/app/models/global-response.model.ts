// Refleja GlobalResponseDTO<T> del backend: TODAS las respuestas
// exitosas vienen envueltas en este formato { message, data }
export interface GlobalResponse<T> {
  message: string;
  data: T;
}