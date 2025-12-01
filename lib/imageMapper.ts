// Image mapping utility for slot machine symbols
// Maps to images in Images/lotto activo/lotto activo/

const IMAGE_NAMES = [
  'Aguila_2.webp',
  'Alacran_2.webp',
  'Ardilla_2.webp',
  'Ballena_2.webp',
  'Burro_2.webp',
  'Caballo_2.webp',
  'Caiman_2.webp',
  'Camello_2.webp',
  'Carnero_2.webp',
  'Cebra_2.webp',
  'Chivo_2.webp',
  'Ciempies_2.webp',
  'Cochino_2.webp',
  'Culebra_2.webp',
  'Delfin_2.webp',
  'Elefante_2.webp',
  'Gallina_2.webp',
  'Gallo_2.webp',
  'Gato_2.webp',
  'Iguana_2.webp',
  'Jirafa_2.webp',
  'Lapa_2.webp',
  'Leon_2.webp',
  'Mono_2.webp',
  'Oso_2.webp',
  'Paloma_2.webp',
  'Pavo_2.webp',
  'Perico_2.webp',
  'Perro_2.webp',
  'Pescado_2.webp',
  'Rana_2.webp',
  'Raton_2.webp',
  'Tigre_2.webp',
  'Toro_2.webp',
  'Vaca_2.webp',
  'Venado_2.webp',
  'Zamuro_2.webp',
  'Zorro_2.webp',
] as const;

// Map old SymbolIds to image indices for compatibility
const SYMBOL_TO_IMAGE_MAP: Record<string, number[]> = {
  'cat': [18], // Gato
  'dog': [28], // Perro
  'bird': [20, 27, 33], // Perico, Paloma, etc.
  'alligator': [6], // Caiman
  'whale': [3, 14], // Ballena, Delfin
  'elephant': [15], // Elefante
  'wild': [], // Will be randomly selected
  'quantum_wild': [], // Will be randomly selected
};

let spinCount = 0;

/**
 * Get a random image path for a symbol
 * On each spin, images alternate randomly
 */
export const getImageForSymbol = (symbolId: string, spinNumber?: number): string => {
  // Use spinNumber if provided, otherwise use global counter
  const currentSpin = spinNumber !== undefined ? spinNumber : spinCount;
  
  // For wild symbols, use random selection based on spin number
  if (symbolId === 'wild' || symbolId === 'quantum_wild') {
    // Use spin number as seed for consistent randomness per spin
    const seed = currentSpin * 37; // Prime number for better distribution
    const randomIndex = (Math.abs(Math.sin(seed)) * IMAGE_NAMES.length) % IMAGE_NAMES.length;
    const imageName = IMAGE_NAMES[Math.floor(randomIndex)];
    // URL encode the path to handle spaces
    const encodedPath = encodeURI(`/Images/lotto activo/lotto activo/${imageName}`);
    return encodedPath;
  }
  
  // For regular symbols, map to specific images or random from pool
  const mappedIndices = SYMBOL_TO_IMAGE_MAP[symbolId];
  
  if (mappedIndices && mappedIndices.length > 0) {
    // Cycle through mapped images based on spin count
    const index = mappedIndices[currentSpin % mappedIndices.length];
    const imageName = IMAGE_NAMES[index];
    return encodeURI(`/Images/lotto activo/lotto activo/${imageName}`);
  }
  
  // Fallback: use spin number to select image consistently
  const imageIndex = (currentSpin * 7 + symbolId.charCodeAt(0)) % IMAGE_NAMES.length;
  const imageName = IMAGE_NAMES[imageIndex];
  return encodeURI(`/Images/lotto activo/lotto activo/${imageName}`);
};

/**
 * Get a random image for spinning animation
 */
export const getRandomSpinImage = (): string => {
  const randomIndex = Math.floor(Math.random() * IMAGE_NAMES.length);
  const imageName = IMAGE_NAMES[randomIndex];
  return encodeURI(`/Images/lotto activo/lotto activo/${imageName}`);
};

/**
 * Get all images for spinning animation
 */
export const getAllImages = (): string[] => {
  return IMAGE_NAMES.map(name => encodeURI(`/Images/lotto activo/lotto activo/${name}`));
};

/**
 * Reset the spin counter (call on each new spin)
 */
export const incrementSpinCount = (): void => {
  spinCount++;
};
