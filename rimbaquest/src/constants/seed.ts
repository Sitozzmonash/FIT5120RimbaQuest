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

export const OFFLINE_LOCATIONS: LocationItem[] = [
  { id: 'loc_bukit_gasing', name: 'Bukit Gasing Forest Reserve', type: 'Forest reserve', area: 'Petaling Jaya, Selangor', description: 'A family-friendly green lung with gentle forest trails. Birds and butterflies have previously been observed here.', facilities: ['Trails', 'Parking', 'Rest area'], best_time: '7:00–10:00 AM', distance_km: 1.2, why_recommended: 'Gentle trails and safe walking paths near the city.', typical_wildlife: 'Butterflies, Birds, Small Mammals' },
  { id: 'loc_perdana_botanical', name: 'Perdana Botanical Gardens', type: 'Botanical garden', area: 'Kuala Lumpur', description: 'Kuala Lumpur’s main gardens, where butterflies and garden birds may be encountered along open paths.', facilities: ['Paths', 'Parking', 'Restroom', 'Playground'], best_time: '8:00–11:00 AM', distance_km: 2.0, why_recommended: 'Open, family-friendly paths in the city.', typical_wildlife: 'Butterflies, Birds' },
  { id: 'loc_kl_forest_eco_park', name: 'KL Forest Eco Park', type: 'Forest park', area: 'Kuala Lumpur', description: 'A pocket of rainforest beside the KL Tower. Birds and small mammals have previously been observed here.', facilities: ['Trails', 'Boardwalk', 'Rest area'], best_time: '7:00–10:00 AM', distance_km: 3.5, why_recommended: 'Short city-centre forest walk.', typical_wildlife: 'Birds, Small Mammals, Butterflies' },
  { id: 'loc_frim', name: 'FRIM (Forest Research Institute Malaysia)', type: 'Research forest', area: 'Kepong, Kuala Lumpur', description: 'A research rainforest with a canopy walkway. Canopy birds and mammals may be encountered on the trails.', facilities: ['Canopy walkway', 'Trails', 'Visitor Centre', 'Parking'], best_time: '8:00–11:00 AM', distance_km: 12.0, why_recommended: 'Canopy walkway and rainforest trails.', typical_wildlife: 'Canopy Birds, Mammals, Butterflies' },
  { id: 'loc_per_paya_indah', name: 'Paya Indah Wetlands', type: 'Wetland reserve', area: 'Dengkil, Selangor', description: 'A wetland reserve with observation towers. Wetland birds and reptiles have previously been recorded around this area.', facilities: ['Wetland trails', 'Observation towers', 'Visitor Centre'], best_time: '8:00–11:00 AM', distance_km: 45.0, why_recommended: 'Boardwalks and hides for safe watching.', typical_wildlife: 'Wetland Birds, Crocodiles, Sun Bears, Reptiles' },
  { id: 'loc_kuala_selangor', name: 'Kuala Selangor Nature Park', type: 'Nature park', area: 'Kuala Selangor, Selangor', description: 'Mangrove boardwalks where wetland birds and reptiles may be encountered. Sightings are never guaranteed.', facilities: ['Mangrove boardwalk', 'Bird hides', 'Parking'], best_time: '5:00–8:00 PM', distance_km: 65.0, why_recommended: 'Safe boardwalks over tidal wetlands.', typical_wildlife: 'Mangrove Birds, Reptiles, Fireflies' },
];

export const CATEGORIES = ['Mammal', 'Bird', 'Butterfly', 'Reptile'];

export const CATEGORY_APPEARANCE: Record<string, string> = {
  Mammal: 'Fur or hair on the body, visible ears and nose, and four limbs with a tail.',
  Bird: 'Feathers, a hard beak, two wings, two legs, and tail feathers at the back.',
  Butterfly: 'A thin body, six legs, two antennae, and four broad, patterned wings.',
  Reptile: 'Dry, scaly skin or a hard shell, a long low body, and a long tail.',
};

export const WILDLIFE_FILTERS = [
  { id: 'All', label: 'All Wildlife' },
  { id: 'Mammal', label: 'Mammals' },
  { id: 'Bird', label: 'Birds' },
  { id: 'Butterfly', label: 'Butterflies / Insects' },
  { id: 'Reptile', label: 'Reptiles' },
];

const CATEGORY_NEEDLES: Record<string, string[]> = {
  Mammal: ['mammal'],
  Bird: ['bird'],
  Butterfly: ['butterfl', 'insect'],
  Reptile: ['reptile'],
};

export function locationMatchesQuery(loc: LocationItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${loc.name} ${loc.area}`.toLowerCase();
  const aliases = q === 'kl' ? ['kuala lumpur', 'kl'] : [q];
  return aliases.some((term) => hay.includes(term));
}

export function locationMatchesCategory(loc: LocationItem, category: string): boolean {
  if (category === 'All') return true;
  const hay = `${loc.typical_wildlife || ''} ${loc.description || ''} ${loc.why_recommended || ''}`.toLowerCase();
  return (CATEGORY_NEEDLES[category] || [category.toLowerCase()]).some((needle) => hay.includes(needle));
}
