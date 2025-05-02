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

export function generateUserName(): string {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return `${adj} ${animal}`;
}