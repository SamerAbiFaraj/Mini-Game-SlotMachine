// Venezuelan Lotto Activo Animal Mapping
// Maps roulette numbers (0-36 + 00) to their corresponding animal images
// American Roulette Format (38 pockets)

export interface AnimalMapping {
    number: string;
    animal: string;
    imagePath: string;
}

export const ANIMAL_MAPPINGS: AnimalMapping[] = [
    { number: "0", animal: "Delfin", imagePath: "images/Delfin_2.webp" },
    { number: "00", animal: "Tigre", imagePath: "images/Tigre_2.webp" },
    { number: "1", animal: "Carnero", imagePath: "images/Carnero_2.webp" },
    { number: "2", animal: "Toro", imagePath: "images/Toro_2.webp" },
    { number: "3", animal: "Ciempies", imagePath: "images/Ciempies_2.webp" },
    { number: "4", animal: "Alacran", imagePath: "images/Alacran_2.webp" },
    { number: "5", animal: "Leon", imagePath: "images/Leon_2.webp" },
    { number: "6", animal: "Rana", imagePath: "images/Rana_2.webp" },
    { number: "7", animal: "Perico", imagePath: "images/Perico_2.webp" },
    { number: "8", animal: "Raton", imagePath: "images/Raton_2.webp" },
    { number: "9", animal: "Aguila", imagePath: "images/Aguila_2.webp" },
    { number: "10", animal: "Caballo", imagePath: "images/Caballo_2.webp" },
    { number: "11", animal: "Gato", imagePath: "images/Gato_2.webp" },
    { number: "12", animal: "Leon", imagePath: "images/Leon_2.webp" },
    { number: "13", animal: "Mono", imagePath: "images/Mono_2.webp" },
    { number: "14", animal: "Paloma", imagePath: "images/Paloma_2.webp" },
    { number: "15", animal: "Zorro", imagePath: "images/Zorro_2.webp" },
    { number: "16", animal: "Oso", imagePath: "images/Oso_2.webp" },
    { number: "17", animal: "Pavo", imagePath: "images/Pavo_2.webp" },
    { number: "18", animal: "Burro", imagePath: "images/Burro_2.webp" },
    { number: "19", animal: "Chivo", imagePath: "images/Chivo_2.webp" },
    { number: "20", animal: "Cochino", imagePath: "images/Cochino_2.webp" },
    { number: "21", animal: "Gallo", imagePath: "images/Gallo_2.webp" },
    { number: "22", animal: "Camello", imagePath: "images/Camello_2.webp" },
    { number: "23", animal: "Cebra", imagePath: "images/Cebra_2.webp" },
    { number: "24", animal: "Iguana", imagePath: "images/Iguana_2.webp" },
    { number: "25", animal: "Gallina", imagePath: "images/Gallina_2.webp" },
    { number: "26", animal: "Vaca", imagePath: "images/Vaca_2.webp" },
    { number: "27", animal: "Perro", imagePath: "images/Perro_2.webp" },
    { number: "28", animal: "Zamuro", imagePath: "images/Zamuro_2.webp" },
    { number: "29", animal: "Elefante", imagePath: "images/Elefante_2.webp" },
    { number: "30", animal: "Caiman", imagePath: "images/Caiman_2.webp" },
    { number: "31", animal: "Lapa", imagePath: "images/Lapa_2.webp" },
    { number: "32", animal: "Ardilla", imagePath: "images/Ardilla_2.webp" },
    { number: "33", animal: "Pescado", imagePath: "images/Pescado_2.webp" },
    { number: "34", animal: "Venado", imagePath: "images/Venado_2.webp" },
    { number: "35", animal: "Ballena", imagePath: "images/Ballena_2.webp" },
    { number: "36", animal: "Culebra", imagePath: "images/Culebra_2.webp" },
];

// Helper function to get animal info by number
export const getAnimalByNumber = (number: string): AnimalMapping | undefined => {
    return ANIMAL_MAPPINGS.find(mapping => mapping.number === number);
};

// Helper function to get image path by number
export const getAnimalImagePath = (number: string): string | undefined => {
    return getAnimalByNumber(number)?.imagePath;
};

// Helper function to get animal name by number
export const getAnimalName = (number: string): string | undefined => {
    return getAnimalByNumber(number)?.animal;
};
