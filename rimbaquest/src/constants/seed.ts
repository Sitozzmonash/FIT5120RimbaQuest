import { LocationItem, Species } from '../types';

export const SEED_SPECIES: Species[] = [
  { id: 'sp_common_mormon', common_name: 'Common Mormon', scientific_name: 'Papilio polytes', category: 'Butterfly', habitat: 'Gardens, parks and forest edges across Malaysia.', diet: 'Flower nectar and citrus leaves.', fun_fact: 'Some females copy the look of a poisonous butterfly.', hp: 75, base_attack: 34 },
  { id: 'sp_malayan_tapir', common_name: 'Malayan Tapir', scientific_name: 'Tapirus indicus', category: 'Mammal', habitat: 'Rainforest, often near water.', diet: 'Leaves, shoots and fruit.', fun_fact: 'Tapir babies are born with stripes and spots.', hp: 125, base_attack: 26 },
  { id: 'sp_oriental_pied_hornbill', common_name: 'Oriental Pied Hornbill', scientific_name: 'Anthracoceros albirostris', category: 'Bird', habitat: 'Lowland forests, forest edges and gardens.', diet: 'Fruit, insects and small animals.', fun_fact: 'Its wingbeats can make a loud whooshing sound.', hp: 98, base_attack: 32 },
  { id: 'sp_asian_elephant', common_name: 'Asian Elephant', scientific_name: 'Elephas maximus', category: 'Mammal', habitat: 'Forests and forest edges in Malaysia.', diet: 'Grass, leaves, bark and fruit.', fun_fact: 'Its trunk helps it smell, drink and pick up food.', hp: 135, base_attack: 28 },
  { id: 'sp_green_sea_turtle', common_name: 'Green Sea Turtle', scientific_name: 'Chelonia mydas', category: 'Reptile', habitat: 'Tropical seas, seagrass beds and nesting beaches.', diet: 'Seagrass and algae.', fun_fact: 'They return to beaches near where they hatched.', hp: 145, base_attack: 22 },
  { id: 'sp_malayan_pangolin', common_name: 'Malayan Pangolin', scientific_name: 'Manis javanica', category: 'Mammal', habitat: 'Forests and plantations with plenty of cover.', diet: 'Ants and termites.', fun_fact: 'Its scales are made from keratin, like our fingernails.', hp: 120, base_attack: 24 },
  { id: 'sp_malayan_tiger', common_name: 'Malayan Tiger', scientific_name: 'Panthera tigris jacksoni', category: 'Mammal', habitat: 'Dense tropical forests in Peninsular Malaysia.', diet: 'Deer and other wild animals.', fun_fact: 'Every tiger has a unique stripe pattern.', hp: 130, base_attack: 30 },
  { id: 'sp_mouse_deer', common_name: 'Lesser Mouse-deer', scientific_name: 'Tragulus kanchil', category: 'Mammal', habitat: 'Forest undergrowth and river edges.', diet: 'Leaves, fruit and fungi.', fun_fact: 'It is one of the world’s smallest hoofed mammals.', hp: 115, base_attack: 23 },
  { id: 'sp_proboscis_monkey', common_name: 'Proboscis Monkey', scientific_name: 'Nasalis larvatus', category: 'Mammal', habitat: 'Mangroves and riverine forests in Borneo.', diet: 'Leaves, seeds and unripe fruit.', fun_fact: 'Adult males have famously long noses.', hp: 122, base_attack: 25 },
  { id: 'sp_reticulated_python', common_name: 'Reticulated Python', scientific_name: 'Malayopython reticulatus', category: 'Reptile', habitat: 'Forests, wetlands and waterways.', diet: 'Small animals.', fun_fact: 'It has a beautiful net-like pattern on its skin.', hp: 142, base_attack: 26 },
  { id: 'sp_rhinoceros_hornbill', common_name: 'Rhinoceros Hornbill', scientific_name: 'Buceros rhinoceros', category: 'Bird', habitat: 'Large, mature rainforests.', diet: 'Fruit, insects and small animals.', fun_fact: 'It is the state bird of Sarawak.', hp: 102, base_attack: 31 },
  { id: 'sp_saltwater_crocodile', common_name: 'Saltwater Crocodile', scientific_name: 'Crocodylus porosus', category: 'Reptile', habitat: 'Rivers, mangroves and estuaries.', diet: 'Fish and other animals.', fun_fact: 'It is the world’s largest living reptile.', hp: 150, base_attack: 27 },
  { id: 'sp_sunda_colugo', common_name: 'Sunda Colugo', scientific_name: 'Galeopterus variegatus', category: 'Mammal', habitat: 'Forest canopy and tall trees.', diet: 'Leaves, shoots and fruit.', fun_fact: 'It glides between trees using a wide skin membrane.', hp: 118, base_attack: 25 },
  { id: 'sp_sun_bear', common_name: 'Sun Bear', scientific_name: 'Helarctos malayanus', category: 'Mammal', habitat: 'Lowland tropical rainforest.', diet: 'Fruit, insects and honey.', fun_fact: 'It is the smallest bear species in the world.', hp: 128, base_attack: 27 },
  { id: 'sp_tailed_jay', common_name: 'Tailed Jay', scientific_name: 'Graphium agamemnon', category: 'Butterfly', habitat: 'Gardens and forest edges.', diet: 'Flower nectar.', fun_fact: 'It is a very fast-flying butterfly.', hp: 78, base_attack: 35 },
];

export const OFFLINE_SPECIES = Array.from(
  new Map(SEED_SPECIES.map((item) => [item.id, item])).values(),
);

// A small, reviewed local catalogue keeps Discover usable if the optional
// backend is unavailable. It does not call an external maps or places service.
export const OFFLINE_LOCATIONS: LocationItem[] = [
  { id: 'loc_bukit_gasing', name: 'Bukit Gasing Forest Reserve', type: 'Forest Park', area: 'Petaling Jaya, Selangor', lat: 3.0964, lng: 101.65, verified: true, description: 'A family-friendly green space with forest trails close to the city.', facilities: ['Trails', 'Parking', 'Rest area'], best_time: 'Daily, 6:00 AM–7:00 PM', distance_km: 0, why_recommended: 'Gentle trails for a calm family walk.', typical_wildlife: 'Butterflies, Birds, Small Mammals', responsible_exploration: 'Stay on marked paths and watch wildlife quietly from a distance.' },
  { id: 'loc_kl_forest_eco_park', name: 'KL Forest Eco Park', type: 'Forest Park', area: 'Bukit Nanas, Kuala Lumpur', lat: 3.1529313, lng: 101.7026923, verified: true, description: 'A pocket of rainforest in central Kuala Lumpur.', facilities: ['Trails', 'Boardwalk', 'Rest area'], best_time: 'Daily, 8:00 AM–4:30 PM', distance_km: 0, why_recommended: 'A short city-centre forest walk.', typical_wildlife: 'Birds, Small Mammals, Butterflies', responsible_exploration: 'Keep to the boardwalk and never feed wild animals.' },
  { id: 'loc_perdana_botanical', name: 'Perdana Botanical Gardens', type: 'Botanical Garden', area: 'Kuala Lumpur', lat: 3.1437954, lng: 101.6848169, verified: true, description: 'Kuala Lumpur gardens with open paths and planted forest edges.', facilities: ['Paths', 'Parking', 'Restroom', 'Playground'], best_time: 'Daily, 6:30 AM–10:00 PM', distance_km: 0, why_recommended: 'Open, family-friendly paths in the city.', typical_wildlife: 'Butterflies, Birds', official_website: 'https://www.dbkl.gov.my/fasiliti-awam/taman-awam/taman-botani-perdana', responsible_exploration: 'Look with your eyes, not your hands, and leave plants where they are.' },
  { id: 'loc_zoo_negara', name: 'Zoo Negara', type: 'Zoo', area: 'Ampang, Selangor', lat: 3.2106626, lng: 101.7577617, verified: true, description: 'Malaysia’s national zoo with many animal exhibits.', facilities: ['Animal exhibits', 'Playground', 'Food stalls'], best_time: 'Daily, 9:00 AM–5:00 PM', distance_km: 0, why_recommended: 'A safe place to learn about many animals.', typical_wildlife: 'Mammals, Birds, Reptiles', official_website: 'https://www.zoonegara.my/', responsible_exploration: 'Follow zoo signs and give every animal plenty of space.' },
  { id: 'loc_kl_bird_park', name: 'KL Bird Park', type: 'Wildlife Park', area: 'Perdana Botanical Gardens, Kuala Lumpur', lat: 3.1436519, lng: 101.6889297, verified: true, description: 'A walk-in bird park with large aviaries and trails.', facilities: ['Aviaries', 'Trails', 'Parking'], best_time: 'Daily, 9:00 AM–6:00 PM', distance_km: 0, why_recommended: 'A close look at many bird species.', typical_wildlife: 'Hornbills, Parrots, Waterbirds', official_website: 'https://www.klbirdpark.com/', responsible_exploration: 'Walk calmly and do not chase or touch birds.' },
  { id: 'loc_farm_in_the_city', name: 'Farm in the City', type: 'Petting Zoo', area: 'Seri Kembangan, Selangor', lat: 2.9925, lng: 101.713, verified: true, description: 'An indoor and outdoor animal farm experience.', facilities: ['Animal feeding', 'Playground', 'Parking'], best_time: 'Daily, 9:30 AM–6:00 PM', distance_km: 0, why_recommended: 'A supervised way to meet friendly farm animals.', typical_wildlife: 'Goats, Rabbits, Tortoises, Birds', official_website: 'https://farminthecity.my/', responsible_exploration: 'Only feed animals with approved food and wash your hands afterwards.' },
  { id: 'loc_just_farm', name: 'Just Farm', type: 'Petting Zoo', area: 'IOI Mall Damansara, Petaling Jaya, Selangor', lat: 3.1487454, lng: 101.5947478, verified: true, description: 'A fully indoor petting zoo inside IOI Mall Damansara.', facilities: ['Indoor animal encounters', 'Animal feeding', 'Mall parking'], best_time: 'Daily, 10:30 AM–8:30 PM', distance_km: 0, why_recommended: 'A weather-proof, air-conditioned place for supervised animal encounters.', official_website: 'https://www.justfarm.com.my/', responsible_exploration: 'Follow staff guidance, use approved food only, and wash your hands afterwards.' },
  { id: 'loc_kuala_selangor', name: 'Kuala Selangor Nature Park', type: 'Nature Park', area: 'Kuala Selangor, Selangor', lat: 3.3337767, lng: 101.2403342, verified: true, description: 'Mangrove boardwalks and bird hides near coastal wetlands.', facilities: ['Mangrove boardwalk', 'Bird hides', 'Parking'], best_time: 'Daily, 9:00 AM–6:00 PM', distance_km: 0, why_recommended: 'A safe place to watch wetland wildlife.', typical_wildlife: 'Mangrove Birds, Reptiles, Fireflies', responsible_exploration: 'Stay on the boardwalk and never remove animals, shells or plants.' },
];

export const WILDLIFE_FILTERS = [
  { id: 'All', label: 'All Wildlife' },
  { id: 'Mammal', label: 'Mammals' },
  { id: 'Bird', label: 'Birds' },
  { id: 'Butterfly', label: 'Butterflies' },
  { id: 'Reptile', label: 'Reptiles' },
];

// Epic 2 filters the locations list by place category instead of state.
// The ids must match the backend location ``type`` values.
export const LOCATION_CATEGORY_FILTERS = [
  { id: 'All', label: 'All' },
  { id: 'Zoo', label: 'Zoos' },
  { id: 'Wildlife Park', label: 'Wildlife Parks' },
  { id: 'Petting Zoo', label: 'Petting Zoos' },
  { id: 'Aquarium', label: 'Aquariums' },
  { id: 'Forest Park', label: 'Forest Parks' },
  { id: 'Nature Park', label: 'Nature Parks' },
  { id: 'Botanical Garden', label: 'Botanical Gardens' },
];

export function locationMatchesQuery(loc: LocationItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${loc.name} ${loc.area}`.toLowerCase();
  const aliases = q === 'kl' ? ['kuala lumpur', 'kl'] : [q];
  return aliases.some((term) => hay.includes(term));
}

export function locationMatchesCategory(loc: LocationItem, category: string): boolean {
  if (category === 'All') return true;
  return (loc.type || '').toLowerCase() === category.toLowerCase();
}
