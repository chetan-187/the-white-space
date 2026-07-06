const adjectives = [
    "Adventurous", "Ambitious", "Benevolent", "Charming", "Daring", "Determined", "Energetic",
    "Fearless", "Generous", "Heroic", "Imaginative", "Jovial", "Lively", "Mysterious", "Noble",
    "Optimistic", "Passionate", "Resilient", "Serene", "Tenacious", "Unstoppable", "Valiant",
    "Witty", "Zealous"
];

const animals = [
    "Armadillo", "Badger", "Caracal", "Chameleon", "Dragonfly", "Eagle", "Falcon", "Gecko",
    "Hammerhead", "Ibex", "Jaguar", "Kangaroo", "Lemming", "Narwhal", "Ocelot", "Pangolin",
    "Quokka", "Raccoon", "Snow Leopard", "Tasmanian Devil", "Uakari", "Vulture", "Walrus",
    "Xenopus", "Yak", "Zorilla"
];

// Deterministic hash so the same userId always maps to the same name/color,
// across refreshes and even server restarts
function hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
    }
    return hash;
}

export function generateUserName(userId: string): string {
    const hash = hashString(userId);
    const adj = adjectives[hash % adjectives.length];
    const animal = animals[Math.floor(hash / adjectives.length) % animals.length];
    return `${adj} ${animal}`;
}

export function generateUserColor(userId: string): string {
    // Hue from the id; fixed saturation/lightness keeps white text readable
    const hue = hashString(`${userId}-color`) % 360;
    return `hsl(${hue}, 75%, 45%)`;
}