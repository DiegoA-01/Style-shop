// Convierte el nombre de una categoría en la ruta de su imagen del catálogo.
export function getCategoryImage(categoryName: string): string {
  // Se quitan mayúsculas y tildes para que "Bóxer" y "boxer" funcionen igual.
  const normalized = categoryName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Estos alias conectan el nombre que escribe el usuario con el nombre real del archivo.
  // Las categorías sin alias buscan directamente, por ejemplo: medias -> medias.jpg.
  const imageNames: Record<string, string> = {
    boxer: 'boxer',
    boxers: 'boxer',
    camisa: 'camisetas',
    camisas: 'camisetas',
    camiseta: 'camisetas',
    camisetas: 'camisetas',
    gorra: 'gorras',
    gorras: 'gorras',
    guante: 'guantes',
    guantes: 'guantes',
    pantalon: 'pantalones',
    pantalones: 'pantalones',
    saco: 'sacos',
    sacos: 'sacos',
    zapato: 'zapatos',
    zapatos: 'zapatos',
  };

  const fileName = imageNames[normalized] ?? normalized;
  return `/images/categories/${fileName}.jpg`;
}