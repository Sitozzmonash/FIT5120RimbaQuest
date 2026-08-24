import { useEffect, useMemo, useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Screen =
  | 'home'
  | 'photo'
  | 'category'
  | 'species'
  | 'confirm'
  | 'success'
  | 'collection'
  | 'about'
  | 'battle_stats'
  | 'facts'
  | 'gallery'
  | 'quiz'
  | 'locked'
  | 'progress'
  | 'locations'
  | 'location_detail'
  | 'battle_select'
  | 'battle_arena'
  | 'auth'
  | 'profile_edit'
  | 'forgot_password';

type Species = {
  id: string;
  common_name: string;
  scientific_name: string;
  category: string;
  habitat: string;
  diet: string;
  fun_fact: string;
  act716_status?: string | null;
  hp?: number;
  base_attack?: number;
  ability_1?: string;
  ability_2?: string;
  ability_3?: string;
  abilities_locked?: boolean;
};

type QuizQuestion = {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
};

type RecentCapture = Species & {
  location_label?: string | null;
  recorded_at?: string | null;
  photo_url?: string | null;
};

type LocationItem = {
  id: string;
  name: string;
  type: string;
  area: string;
  lat?: number;
  lng?: number;
  verified?: boolean;
  description: string;
  facilities: string[];
  best_time: string;
  distance_km: number;
  why_recommended: string;
  typical_wildlife?: string;
};

type UserProfile = {
  id: number;
  username: string;
  display_name: string;
  avatar: string;
  age: number;
  age_band: string;
  xp: number;
  level: number;
};

const IMAGES = {
  Mammal: require('../../assets/wildlife/mammals.jpg'),
  Bird: require('../../assets/wildlife/birds.jpg'),
  Butterfly: require('../../assets/wildlife/butterflies.jpg'),
  Reptile: require('../../assets/wildlife/reptiles.jpg'),
  marmoset: require('../../assets/wildlife/marmoset.jpg'),
  tapir: require('../../assets/wildlife/malayan-tapir-card.jpg'),
  recent: require('../../assets/wildlife/recent-marmoset.jpg'),
};

const AVATAR_ICONS: Record<string, string> = {
  tapir: '🦛',
  tiger: '🐯',
  hornbill: '🦜',
  elephant: '🐘',
  pangolin: '🦔',
  butterfly: '🦋',
};

const SPECIES_IMAGES: Record<string, number> = {
  sp_asian_elephant: require('../../assets/species/sp_asian_elephant.jpg'),
  sp_common_mormon: require('../../assets/species/sp_common_mormon.jpg'),
  sp_green_sea_turtle: require('../../assets/species/sp_green_sea_turtle.jpg'),
  sp_malayan_pangolin: require('../../assets/species/sp_malayan_pangolin.jpg'),
  sp_malayan_tapir: require('../../assets/species/sp_malayan_tapir.jpg'),
  sp_malayan_tiger: require('../../assets/species/sp_malayan_tiger.jpg'),
  sp_mouse_deer: require('../../assets/species/sp_mouse_deer.jpg'),
  sp_oriental_pied_hornbill: require('../../assets/species/sp_oriental_pied_hornbill.jpg'),
  sp_proboscis_monkey: require('../../assets/species/sp_proboscis_monkey.jpg'),
  sp_reticulated_python: require('../../assets/species/sp_reticulated_python.jpg'),
  sp_rhinoceros_hornbill: require('../../assets/species/sp_rhinoceros_hornbill.jpg'),
  sp_saltwater_crocodile: require('../../assets/species/sp_saltwater_crocodile.jpg'),
  sp_sunda_colugo: require('../../assets/species/sp_sunda_colugo.jpg'),
  sp_sun_bear: require('../../assets/species/sp_sun_bear.jpg'),
  sp_tailed_jay: require('../../assets/species/sp_tailed_jay.jpg'),
};
Object.assign(SPECIES_IMAGES, {
  sp_ashy_tailorbird: require('../../assets/species/sp_ashy_tailorbird.jpg'),
  sp_asian_blue_quail: require('../../assets/species/sp_asian_blue_quail.jpg'),
  sp_asian_small_clawed_otter: require('../../assets/species/sp_asian_small_clawed_otter.jpg'),
  sp_asiatic_brush_tailed_porcupine: require('../../assets/species/sp_asiatic_brush_tailed_porcupine.jpg'),
  sp_asiatic_golden_cat: require('../../assets/species/sp_asiatic_golden_cat.jpg'),
  sp_asiatic_striped_squirrels: require('../../assets/species/sp_asiatic_striped_squirrels.jpg'),
  sp_banded_civet: require('../../assets/species/sp_banded_civet.jpg'),
  sp_banded_leaf_monkey: require('../../assets/species/sp_banded_leaf_monkey.jpg'),
  sp_banded_linsang: require('../../assets/species/sp_banded_linsang.jpg'),
  sp_banteng: require('../../assets/species/sp_banteng.jpg'),
  sp_barred_eagle_owl: require('../../assets/species/sp_barred_eagle_owl.jpg'),
  sp_bearded_pig: require('../../assets/species/sp_bearded_pig.jpg'),
  sp_binturong: require('../../assets/species/sp_binturong.jpg'),
  sp_black_crowned_pitta: require('../../assets/species/sp_black_crowned_pitta.jpg'),
  sp_black_crowned_pitta_2: require('../../assets/species/sp_black_crowned_pitta_2.jpg'),
  sp_black_giant_squirrel: require('../../assets/species/sp_black_giant_squirrel.jpg'),
  sp_blue_breasted_quail: require('../../assets/species/sp_blue_breasted_quail.jpg'),
  sp_blue_headed_pitta: require('../../assets/species/sp_blue_headed_pitta.jpg'),
  sp_blyth_s_hawk_eagle: require('../../assets/species/sp_blyth_s_hawk_eagle.jpg'),
  sp_bornean_banded_pitta: require('../../assets/species/sp_bornean_banded_pitta.jpg'),
  sp_bornean_orangutan: require('../../assets/species/sp_bornean_orangutan.jpg'),
  sp_bornean_partridge: require('../../assets/species/sp_bornean_partridge.jpg'),
  sp_bornean_yellow_muntjac: require('../../assets/species/sp_bornean_yellow_muntjac.jpg'),
  sp_borneo_bay_cat: require('../../assets/species/sp_borneo_bay_cat.jpg'),
  sp_borneo_earless_monitor: require('../../assets/species/sp_borneo_earless_monitor.jpg'),
  sp_brown_rat: require('../../assets/species/sp_brown_rat.jpg'),
  sp_black_rumped_flameback: require('../../assets/species/sp_black_rumped_flameback.jpg'),
  sp_buffy_fish_owl: require('../../assets/species/sp_buffy_fish_owl.jpg'),
  sp_changeable_hawk_eagle: require('../../assets/species/sp_changeable_hawk_eagle.jpg'),
  sp_chestnut_capped_babbler: require('../../assets/species/sp_chestnut_capped_babbler.jpg'),
  sp_chestnut_capped_thrush: require('../../assets/species/sp_chestnut_capped_thrush.jpg'),
  sp_cinereous_bulbul: require('../../assets/species/sp_cinereous_bulbul.jpg'),
  sp_clouded_leopard: require('../../assets/species/sp_clouded_leopard.jpg'),
  sp_collared_mongoose: require('../../assets/species/sp_collared_mongoose.jpg'),
  sp_common_emerald_dove: require('../../assets/species/sp_common_emerald_dove.jpg'),
  sp_common_hill_myna: require('../../assets/species/sp_common_hill_myna.jpg'),
  sp_common_palm_civet: require('../../assets/species/sp_common_palm_civet.jpg'),
  sp_common_sun_skink: require('../../assets/species/sp_common_sun_skink.jpg'),
  sp_common_treeshrew: require('../../assets/species/sp_common_treeshrew.jpg'),
  sp_common_water_monitor: require('../../assets/species/sp_common_water_monitor.jpg'),
  sp_crab_eating_macaque: require('../../assets/species/sp_crab_eating_macaque.jpg'),
  sp_crab_eating_mongoose: require('../../assets/species/sp_crab_eating_mongoose.jpg'),
  sp_crested_partridge: require('../../assets/species/sp_crested_partridge.jpg'),
  sp_crested_serpent_eagle: require('../../assets/species/sp_crested_serpent_eagle.jpg'),
  sp_crimson_headed_partridge: require('../../assets/species/sp_crimson_headed_partridge.jpg'),
  sp_crimson_winged_woodpecker: require('../../assets/species/sp_crimson_winged_woodpecker.jpg'),
  sp_dark_necked_tailorbird: require('../../assets/species/sp_dark_necked_tailorbird.jpg'),
  sp_dhole: require('../../assets/species/sp_dhole.jpg'),
  sp_dusky_leaf_monkey: require('../../assets/species/sp_dusky_leaf_monkey.jpg'),
  sp_flat_headed_cat: require('../../assets/species/sp_flat_headed_cat.jpg'),
  sp_four_striped_ground_squirrel: require('../../assets/species/sp_four_striped_ground_squirrel.jpg'),
  sp_gaur: require('../../assets/species/sp_gaur.jpg'),
  sp_great_argus: require('../../assets/species/sp_great_argus.jpg'),
  sp_greater_coucal: require('../../assets/species/sp_greater_coucal.jpg'),
  sp_greater_oriental_chevrotain: require('../../assets/species/sp_greater_oriental_chevrotain.jpg'),
  sp_green_backed_heron: require('../../assets/species/sp_green_backed_heron.jpg'),
  sp_green_billed_coucal: require('../../assets/species/sp_green_billed_coucal.jpg'),
  sp_grey_bellied_squirrel: require('../../assets/species/sp_grey_bellied_squirrel.jpg'),
  sp_honey_buzzard: require('../../assets/species/sp_honey_buzzard.jpg'),
  sp_hose_s_civet: require('../../assets/species/sp_hose_s_civet.jpg'),
  sp_hose_s_langur: require('../../assets/species/sp_hose_s_langur.jpg'),
  sp_indomalayan_bamboo_rat: require('../../assets/species/sp_indomalayan_bamboo_rat.jpg'),
  sp_lar_gibbon: require('../../assets/species/sp_lar_gibbon.jpg'),
  sp_large_indian_civet: require('../../assets/species/sp_large_indian_civet.jpg'),
  sp_large_spotted_civet: require('../../assets/species/sp_large_spotted_civet.jpg'),
  sp_large_treeshrew: require('../../assets/species/sp_large_treeshrew.jpg'),
  sp_leopard: require('../../assets/species/sp_leopard.jpg'),
  sp_lesser_dog_faced_fruit_bat: require('../../assets/species/sp_lesser_dog_faced_fruit_bat.jpg'),
  sp_long_tailed_porcupine: require('../../assets/species/sp_long_tailed_porcupine.jpg'),
  sp_long_tailed_sibia: require('../../assets/species/sp_long_tailed_sibia.jpg'),
  sp_mainland_leopard_cat: require('../../assets/species/sp_mainland_leopard_cat.jpg'),
  sp_malay_banded_pitta: require('../../assets/species/sp_malay_banded_pitta.jpg'),
  sp_malay_civet: require('../../assets/species/sp_malay_civet.jpg'),
  sp_malay_crested_fireback: require('../../assets/species/sp_malay_crested_fireback.jpg'),
  sp_malay_ground_cuckoo: require('../../assets/species/sp_malay_ground_cuckoo.jpg'),
  sp_malay_weasel: require('../../assets/species/sp_malay_weasel.jpg'),
  sp_malayan_night_heron: require('../../assets/species/sp_malayan_night_heron.jpg'),
  sp_malayan_peacock_pheasant: require('../../assets/species/sp_malayan_peacock_pheasant.jpg'),
  sp_malayan_porcupine: require('../../assets/species/sp_malayan_porcupine.jpg'),
  sp_malaysian_field_rat: require('../../assets/species/sp_malaysian_field_rat.jpg'),
  sp_malaysian_rail_babbler: require('../../assets/species/sp_malaysian_rail_babbler.jpg'),
  sp_marbled_cat: require('../../assets/species/sp_marbled_cat.jpg'),
  sp_maroon_sureli: require('../../assets/species/sp_maroon_sureli.jpg'),
  sp_masked_palm_civet: require('../../assets/species/sp_masked_palm_civet.jpg'),
  sp_moonrat: require('../../assets/species/sp_moonrat.jpg'),
  sp_mountain_imperial_pigeon: require('../../assets/species/sp_mountain_imperial_pigeon.jpg'),
  sp_noisy_rat: require('../../assets/species/sp_noisy_rat.jpg'),
  sp_northern_treeshrew: require('../../assets/species/sp_northern_treeshrew.jpg'),
  sp_orange_headed_thrush: require('../../assets/species/sp_orange_headed_thrush.jpg'),
  sp_oriental_magpie_robin: require('../../assets/species/sp_oriental_magpie_robin.jpg'),
  sp_otter_civet: require('../../assets/species/sp_otter_civet.jpg'),
  sp_pale_giant_squirrel: require('../../assets/species/sp_pale_giant_squirrel.jpg'),
  sp_plantain_squirrel: require('../../assets/species/sp_plantain_squirrel.jpg'),
  sp_prevost_s_squirrel: require('../../assets/species/sp_prevost_s_squirrel.jpg'),
  sp_red_junglefowl: require('../../assets/species/sp_red_junglefowl.jpg'),
  sp_roughneck_monitor: require('../../assets/species/sp_roughneck_monitor.jpg'),
  sp_rufous_browed_babbler: require('../../assets/species/sp_rufous_browed_babbler.jpg'),
  sp_rufous_tailed_pheasant: require('../../assets/species/sp_rufous_tailed_pheasant.jpg'),
  sp_rufous_tailed_shama: require('../../assets/species/sp_rufous_tailed_shama.jpg'),
  sp_sambar: require('../../assets/species/sp_sambar.jpg'),
  sp_serow: require('../../assets/species/sp_serow.jpg'),
  sp_short_tailed_babbler: require('../../assets/species/sp_short_tailed_babbler.jpg'),
  sp_short_tailed_mongoose: require('../../assets/species/sp_short_tailed_mongoose.jpg'),
  sp_short_tailed_mongoose_2: require('../../assets/species/sp_short_tailed_mongoose_2.jpg'),
  sp_small_indian_mongoose: require('../../assets/species/sp_small_indian_mongoose.jpg'),
  sp_small_toothed_palm_civet: require('../../assets/species/sp_small_toothed_palm_civet.jpg'),
  sp_smooth_coated_otter: require('../../assets/species/sp_smooth_coated_otter.jpg'),
  sp_sooty_capped_babbler: require('../../assets/species/sp_sooty_capped_babbler.jpg'),
  sp_southern_pig_tailed_macaque: require('../../assets/species/sp_southern_pig_tailed_macaque.jpg'),
  sp_southern_red_muntjac: require('../../assets/species/sp_southern_red_muntjac.jpg'),
  sp_spotted_giant_flying_squirrel: require('../../assets/species/sp_spotted_giant_flying_squirrel.jpg'),
  sp_striped_wren_babbler: require('../../assets/species/sp_striped_wren_babbler.jpg'),
  sp_stump_tailed_macaque: require('../../assets/species/sp_stump_tailed_macaque.jpg'),
  sp_sunda_clouded_leopard: require('../../assets/species/sp_sunda_clouded_leopard.jpg'),
  sp_sunda_laughingthrush: require('../../assets/species/sp_sunda_laughingthrush.jpg'),
  sp_sunda_pied_fantail: require('../../assets/species/sp_sunda_pied_fantail.jpg'),
  sp_sunda_stink_badger: require('../../assets/species/sp_sunda_stink_badger.jpg'),
  sp_thick_spined_porcupine: require('../../assets/species/sp_thick_spined_porcupine.jpg'),
  sp_three_striped_ground_squirrel: require('../../assets/species/sp_three_striped_ground_squirrel.jpg'),
  sp_tiger_shrike: require('../../assets/species/sp_tiger_shrike.jpg'),
  sp_tufted_ground_squirrel: require('../../assets/species/sp_tufted_ground_squirrel.jpg'),
  sp_vieillot_s_fireback: require('../../assets/species/sp_vieillot_s_fireback.jpg'),
  sp_western_hooded_pitta: require('../../assets/species/sp_western_hooded_pitta.jpg'),
  sp_white_breasted_waterhen: require('../../assets/species/sp_white_breasted_waterhen.jpg'),
  sp_white_crested_hornbill: require('../../assets/species/sp_white_crested_hornbill.jpg'),
  sp_white_crowned_forktail: require('../../assets/species/sp_white_crowned_forktail.jpg'),
  sp_white_fronted_langur: require('../../assets/species/sp_white_fronted_langur.jpg'),
  sp_white_rumped_shama: require('../../assets/species/sp_white_rumped_shama.jpg'),
  sp_white_tailed_wattled_pheasant: require('../../assets/species/sp_white_tailed_wattled_pheasant.jpg'),
  sp_white_thighed_surili: require('../../assets/species/sp_white_thighed_surili.jpg'),
  sp_wild_boar: require('../../assets/species/sp_wild_boar.jpg'),
  sp_yellow_bellied_bulbul: require('../../assets/species/sp_yellow_bellied_bulbul.jpg'),
  sp_yellow_handed_mitered_langur: require('../../assets/species/sp_yellow_handed_mitered_langur.jpg'),
  sp_yellow_rumped_flycatcher: require('../../assets/species/sp_yellow_rumped_flycatcher.jpg'),
  sp_yellow_throated_marten: require('../../assets/species/sp_yellow_throated_marten.jpg'),
  sp_chestnut_necklaced_partridge: require('../../assets/species/sp_chestnut_necklaced_partridge.jpg'),
  sp_collared_mongoose_2: require('../../assets/species/sp_collared_mongoose_2.jpg'),
  sp_horse_tailed_squirrel: require('../../assets/species/sp_horse_tailed_squirrel.jpg'),
  sp_malaysian_mole: require('../../assets/species/sp_malaysian_mole.jpg'),
  sp_shrew_faced_squirrel: require('../../assets/species/sp_shrew_faced_squirrel.jpg'),
});

const SEED: Species[] = [
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

const OFFLINE_LOCATIONS: LocationItem[] = [
  { id: 'loc_bukit_gasing', name: 'Bukit Gasing Forest Reserve', type: 'Forest reserve', area: 'Petaling Jaya, Selangor', description: 'A family-friendly green lung with gentle forest trails and regular bird and butterfly sightings.', facilities: ['Trails', 'Parking', 'Rest area'], best_time: '7:00–10:00 AM', distance_km: 1.2, why_recommended: 'Gentle trails, safe walking paths, and frequent butterfly observations.', typical_wildlife: 'Butterflies, Birds, Small Mammals' },
  { id: 'loc_frim', name: 'FRIM (Forest Research Institute Malaysia)', type: 'Research forest', area: 'Kepong, Kuala Lumpur', description: 'A massive research rainforest with canopy trails, nature trails and rich biodiversity.', facilities: ['Canopy walkway', 'Trails', 'Visitor Centre', 'Parking'], best_time: '8:00–11:00 AM', distance_km: 12.0, why_recommended: 'Canopy walkway gives a high view of canopy birds and monkeys.', typical_wildlife: 'Canopy Birds, Mammals, Butterflies' },
  { id: 'loc_kuala_selangor', name: 'Kuala Selangor Nature Park', type: 'Nature park', area: 'Kuala Selangor, Selangor', description: 'Protected mangrove forest with boardwalks for watching wetland birds, mudskippers, and reptiles.', facilities: ['Mangrove boardwalk', 'Bird hides', 'Parking'], best_time: '5:00–8:00 PM', distance_km: 65.0, why_recommended: 'Safe boardwalks over tidal wetlands.', typical_wildlife: 'Mangrove Birds, Reptiles, Fireflies' },
  { id: 'loc_per_paya_indah', name: 'Paya Indah Wetlands', type: 'Wetland reserve', area: 'Dengkil, Selangor', description: 'PERHILITAN eco-tourism reserve with observation towers and diverse wetland bird species.', facilities: ['Wetland trails', 'Observation towers', 'Visitor Centre'], best_time: '8:00–11:00 AM', distance_km: 45.0, why_recommended: 'Bird-watching towers and educational trails for children.', typical_wildlife: 'Wetland Birds, Crocodiles, Sun Bears' },
  { id: 'loc_taman_negara', name: 'Taman Negara National Park', type: 'National park', area: 'Jerantut, Pahang', description: 'One of the world’s oldest rainforests, home to elephants, tapirs and hornbills.', facilities: ['Guided trails', 'River boat trips', 'Accommodation'], best_time: 'March–September', distance_km: 180.0, why_recommended: 'Deep rainforest experience with expert rangers.', typical_wildlife: 'Asian Elephants, Tapirs, Hornbills' },
];

const OFFLINE_SPECIES = Array.from(new Map(SEED.map((item) => [item.id, item])).values());
const configuredApiBase = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');
const apiBase = configuredApiBase || Platform.select({ android: 'http://10.0.2.2:8000', web: 'http://127.0.0.1:8000', default: 'http://127.0.0.1:8000' });
const categories = ['Mammal', 'Bird', 'Butterfly', 'Reptile'];

function imageFor(species: Species) { return SPECIES_IMAGES[species.id]; }
function hasReferenceImage(species: Species) { return Boolean(imageFor(species)); }

export default function RimbaQuest() {
  const [screen, setScreen] = useState<Screen>('home');
  const [species, setSpecies] = useState<Species[]>(OFFLINE_SPECIES);
  const [selected, setSelected] = useState<Species>(OFFLINE_SPECIES[0]);
  const [category, setCategory] = useState('Mammal');
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [discovered, setDiscovered] = useState<string[]>(['sp_common_mormon', 'sp_oriental_pied_hornbill']);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<Screen[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Record<string, string[]>>({});
  const [recentCaptures, setRecentCaptures] = useState<RecentCapture[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>(OFFLINE_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationCategoryFilter, setLocationCategoryFilter] = useState('All');
  const [discoveryLocation, setDiscoveryLocation] = useState('Bukit Gasing Forest Reserve');

  // User Auth & Profile State (Epic 1)
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 1,
    username: 'aisyah',
    display_name: 'Aisyah',
    avatar: 'tapir',
    age: 10,
    age_band: '8-11',
    xp: 200,
    level: 1,
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authAge, setAuthAge] = useState('10');
  const [authAvatar, setAuthAvatar] = useState('tapir');
  const [authError, setAuthError] = useState<string | null>(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  // Profile Edit State
  const [editDisplayName, setEditDisplayName] = useState('Aisyah');
  const [editAvatar, setEditAvatar] = useState('tapir');
  const [editAge, setEditAge] = useState('10');

  // Quiz State
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);

  // Battle State (Epic 8)
  const [battlePlayerCard, setBattlePlayerCard] = useState<Species | null>(null);
  const [battlePlayerHp, setBattlePlayerHp] = useState(120);
  const [battlePlayerMaxHp, setBattlePlayerMaxHp] = useState(120);
  const [battleOpponentHp, setBattleOpponentHp] = useState(100);
  const [battleOpponentMaxHp, setBattleOpponentMaxHp] = useState(100);
  const [battleOpponentName, setBattleOpponentName] = useState('Wild Forest Boar');
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleRound, setBattleRound] = useState(1);
  const [battleOutcome, setBattleOutcome] = useState<'playing' | 'win' | 'lose' | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const refresh = async () => {
    try {
      const childId = currentUser.id || 1;
      const [speciesRes, collectionRes, profileRes, recentRes, locationsRes] = await Promise.all([
        fetch(`${apiBase}/api/v1/species`),
        fetch(`${apiBase}/api/v1/children/${childId}/collection`),
        fetch(`${apiBase}/api/v1/children/${childId}/profile`),
        fetch(`${apiBase}/api/v1/children/${childId}/recent-captures`),
        fetch(`${apiBase}/api/v1/locations`),
      ]);

      if (speciesRes.ok) setSpecies(await speciesRes.json());
      if (collectionRes.ok) {
        const data = await collectionRes.json();
        setDiscovered(data.items.filter((item: { discovered: number }) => item.discovered).map((item: { id: string }) => item.id));
      }
      if (profileRes.ok) {
        const data = await profileRes.json();
        setCurrentUser((prev) => ({
          ...prev,
          display_name: data.display_name,
          avatar: data.avatar,
          age: data.age,
          age_band: data.age_band,
          xp: data.xp,
          level: data.level,
        }));
      }
      if (recentRes.ok) {
        const data = await recentRes.json();
        setRecentCaptures(data.items);
      }
      if (locationsRes.ok) {
        const data = await locationsRes.json();
        if (data.items?.length) setLocations(data.items);
      }
    } catch {
      setNotice('You are exploring in offline demo mode. Discoveries will sync when the backend connects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [currentUser.id]);

  const supportedSpecies = useMemo(() => species.filter(hasReferenceImage), [species]);
  const visibleSpecies = useMemo(() => supportedSpecies
    .filter((item) => filter === 'All' || item.category === filter)
    .sort((left, right) => {
      const unlockOrder = Number(discovered.includes(right.id)) - Number(discovered.includes(left.id));
      return unlockOrder || left.common_name.localeCompare(right.common_name);
    }), [discovered, filter, supportedSpecies]);

  const unlockedSpeciesList = useMemo(() => supportedSpecies.filter((item) => discovered.includes(item.id)), [discovered, supportedSpecies]);

  const selectedCategorySpecies = useMemo(() => supportedSpecies.filter((item) => item.category === category), [category, supportedSpecies]);
  const filteredCategorySpecies = useMemo(() => {
    const query = speciesSearch.trim().toLowerCase();
    if (!query) return selectedCategorySpecies;
    return selectedCategorySpecies.filter((item) => item.common_name.toLowerCase().includes(query) || item.scientific_name.toLowerCase().includes(query));
  }, [selectedCategorySpecies, speciesSearch]);

  const filteredLocations = useMemo(() => {
    const query = locationSearch.trim().toLowerCase();
    return locations.filter((loc) => {
      const matchesQuery = !query || loc.name.toLowerCase().includes(query) || loc.area.toLowerCase().includes(query) || loc.description.toLowerCase().includes(query);
      const matchesCategory = locationCategoryFilter === 'All' || (loc.typical_wildlife?.toLowerCase().includes(locationCategoryFilter.toLowerCase().slice(0, 4)));
      return matchesQuery && matchesCategory;
    });
  }, [locations, locationSearch, locationCategoryFilter]);

  const displayProgress = useMemo(() => ({
    found: discovered.filter((id) => supportedSpecies.some((item) => item.id === id)).length,
    total: supportedSpecies.length,
    xp: currentUser.xp,
    level: currentUser.level,
  }), [discovered, supportedSpecies, currentUser]);

  const open = (next: Screen) => {
    setHistory((current) => [...current, screen]);
    setScreen(next);
  };
  const resetTo = (next: Screen) => {
    setHistory([]);
    setScreen(next);
  };
  const goBack = () => {
    setHistory((current) => {
      const previous = current[current.length - 1];
      setScreen(previous ?? 'home');
      return current.slice(0, -1);
    });
  };

  const startDiscovery = (presetLocation?: string) => {
    if (presetLocation) setDiscoveryLocation(presetLocation);
    setPhotoUri(null);
    resetTo('photo');
  };

  const takePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) {
      setPhotoUri(photo.uri);
      open('category');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
        open('category');
      }
    } catch {
      setPhotoUri(null);
      open('category');
    }
  };

  const useSamplePhoto = () => {
    setPhotoUri(null);
    open('category');
  };

  const discoveryPhoto = photoUri ? { uri: photoUri } : IMAGES.marmoset;

  const chooseSpecies = (item: Species) => {
    setSelected(item);
    open('confirm');
  };

  const recordDiscovery = async () => {
    const savePersonalPhoto = () => {
      if (!photoUri) return;
      setGalleryPhotos((current) => ({
        ...current,
        [selected.id]: [photoUri, ...(current[selected.id] ?? [])],
      }));
    };
    try {
      const response = await fetch(`${apiBase}/api/v1/children/${currentUser.id}/discoveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species_id: selected.id, location_label: discoveryLocation }),
      });
      if (!response.ok) throw new Error('Unable to save');
      const result = await response.json() as { first_discovery?: boolean; total_xp?: number };
      if (result.first_discovery && !discovered.includes(selected.id)) {
        setDiscovered((current) => [...current, selected.id]);
        setCurrentUser((prev) => ({ ...prev, xp: result.total_xp ?? (prev.xp + 100) }));
      }
      savePersonalPhoto();
      await refresh();
      open('success');
    } catch {
      if (!discovered.includes(selected.id)) {
        setDiscovered((current) => [...current, selected.id]);
        setCurrentUser((prev) => ({ ...prev, xp: prev.xp + 100 }));
      }
      savePersonalPhoto();
      open('success');
    }
  };

  // Auth Operations (Epic 1)
  const handleRegister = async () => {
    setAuthError(null);
    if (!authUsername.trim()) return setAuthError('Please enter a username.');
    if (authUsername.length < 3 || authUsername.length > 20) return setAuthError('Username must be between 3 and 20 characters.');
    if (authUsername.includes(' ')) return setAuthError('Username cannot contain spaces.');
    if (!authEmail.trim() || !authEmail.includes('@') || !authEmail.includes('.')) return setAuthError('Please enter a valid email address.');
    if (!authPassword) return setAuthError('Please create a password.');
    if (authPassword.length < 6) return setAuthError('Password must be at least 6 characters.');
    if (authPassword !== authConfirmPassword) return setAuthError('Passwords do not match. Please confirm your password.');

    try {
      const res = await fetch(`${apiBase}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername.trim(),
          age: parseInt(authAge, 10) || 10,
          email: authEmail.trim(),
          password: authPassword,
          avatar: authAvatar,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setAuthError(data.detail || 'Registration failed.');
      setCurrentUser({
        id: data.child_id,
        username: data.username,
        display_name: data.display_name,
        avatar: data.avatar,
        age: data.age,
        age_band: '8-11',
        xp: data.xp,
        level: data.level,
      });
      resetTo('home');
    } catch {
      // Offline fallback
      setCurrentUser({
        id: 2,
        username: authUsername.trim(),
        display_name: authUsername.trim(),
        avatar: authAvatar,
        age: parseInt(authAge, 10) || 10,
        age_band: '8-11',
        xp: 0,
        level: 1,
      });
      resetTo('home');
    }
  };

  const handleLogin = async () => {
    setAuthError(null);
    if (!authUsername.trim()) return setAuthError('Please enter your username or email.');
    if (!authPassword) return setAuthError('Please enter your password.');

    try {
      const res = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email: authUsername.trim(), password: authPassword }),
      });
      const data = await res.json();
      if (!res.ok) return setAuthError(data.detail || 'Invalid username or password.');
      setCurrentUser({
        id: data.child_id,
        username: data.username,
        display_name: data.display_name,
        avatar: data.avatar,
        age: data.age,
        age_band: '8-11',
        xp: data.xp,
        level: data.level,
      });
      resetTo('home');
    } catch {
      setAuthError('Unable to connect to login server. Please check connection.');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/children/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editDisplayName.trim() || currentUser.display_name,
          avatar: editAvatar,
          age: parseInt(editAge, 10) || currentUser.age,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser((prev) => ({
          ...prev,
          display_name: data.display_name,
          avatar: data.avatar,
          age: data.age,
        }));
      }
    } catch {
      setCurrentUser((prev) => ({
        ...prev,
        display_name: editDisplayName.trim() || prev.display_name,
        avatar: editAvatar,
        age: parseInt(editAge, 10) || prev.age,
      }));
    }
    goBack();
  };

  // Battle Logic (Epic 8)
  const initBattle = (card: Species) => {
    setBattlePlayerCard(card);
    const hp = card.hp || 120;
    setBattlePlayerHp(hp);
    setBattlePlayerMaxHp(hp);

    const opponentHp = 100 + Math.floor(Math.random() * 20);
    setBattleOpponentHp(opponentHp);
    setBattleOpponentMaxHp(opponentHp);
    setBattleOpponentName('Wild Forest Boar');
    setBattleLog([
      `🌲 A wild opponent (${'Wild Forest Boar'}) appeared!`,
      `🐾 You sent out ${card.common_name} (HP: ${hp}, ATK: ${card.base_attack || 25})!`,
    ]);
    setBattleRound(1);
    setBattleOutcome('playing');
    open('battle_arena');
  };

  const performAttack = () => {
    if (!battlePlayerCard || isAttacking || battleOutcome !== 'playing') return;
    setIsAttacking(true);

    const playerAtk = battlePlayerCard.base_attack || 25;
    const playerDmg = playerAtk + Math.floor(Math.random() * 8) - 3;
    const nextOpponentHp = Math.max(0, battleOpponentHp - playerDmg);

    const newLogs = [...battleLog, `⚔️ ${battlePlayerCard.common_name} used Basic Strike for ${playerDmg} DMG!`];

    if (nextOpponentHp <= 0) {
      setBattleOpponentHp(0);
      newLogs.push(`🏆 Wild Forest Boar fainted! You won the battle!`);
      setBattleLog(newLogs);
      setBattleOutcome('win');
      setIsAttacking(false);

      // Award XP
      fetch(`${apiBase}/api/v1/children/${currentUser.id}/battle/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ won: true, opponent_name: battleOpponentName, rounds: battleRound }),
      }).then(() => refresh()).catch(() => {});
      return;
    }

    setBattleOpponentHp(nextOpponentHp);

    // Opponent counter-attack after small delay
    setTimeout(() => {
      const oppDmg = 18 + Math.floor(Math.random() * 10);
      const nextPlayerHp = Math.max(0, battlePlayerHp - oppDmg);
      newLogs.push(`💥 ${battleOpponentName} counter-attacked for ${oppDmg} DMG!`);

      if (nextPlayerHp <= 0) {
        setBattlePlayerHp(0);
        newLogs.push(`💔 ${battlePlayerCard.common_name} is exhausted! Try another round!`);
        setBattleOutcome('lose');
      } else {
        setBattlePlayerHp(nextPlayerHp);
      }

      setBattleLog(newLogs);
      setBattleRound((r) => r + 1);
      setIsAttacking(false);
    }, 600);
  };

  const openQuiz = async () => {
    const fallback: QuizQuestion = {
      question: `Which statement about ${selected.common_name} is true?`,
      options: [selected.fun_fact, 'Wild animals are safest when we touch and feed them.', 'Every Malaysian animal lives in the ocean.'],
      correct_index: 0,
      explanation: selected.fun_fact,
    };
    setQuizAnswer(null);
    setQuizQuestion(fallback);
    open('quiz');
    try {
      const response = await fetch(`${apiBase}/api/v1/species/${selected.id}/quiz`);
      if (!response.ok) return;
      const data = await response.json() as { questions: QuizQuestion[] | string };
      const questions = typeof data.questions === 'string' ? JSON.parse(data.questions) as QuizQuestion[] : data.questions;
      if (questions[0]) setQuizQuestion(questions[0]);
    } catch { /* Offline fallback */ }
  };

  // Reusable UI Components
  const Header = ({ title, back = true }: { title: string; back?: boolean }) => (
    <View style={styles.header}>
      {back ? <Tap label="Go back" style={styles.back} onPress={goBack}><Text style={styles.backText}>‹</Text></Tap> : <View style={styles.backSpacer} />}
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.backSpacer} />
    </View>
  );

  const Bottom = () => (
    <View style={styles.bottomNav}>
      <Nav icon="⌂" label="Home" active={screen === 'home'} onPress={() => resetTo('home')} />
      <Nav icon="🗺️" label="Places" active={screen === 'locations'} onPress={() => resetTo('locations')} />
      <Tap label="Record wildlife sighting" style={styles.recordButton} onPress={() => startDiscovery()}>
        <View style={styles.cameraNavIcon}><View style={styles.cameraNavLens} /></View>
      </Tap>
      <Nav icon="🗃️" label="Cards" active={screen === 'collection'} onPress={() => resetTo('collection')} />
      <Nav icon="⚔️" label="Battle" active={screen === 'battle_select' || screen === 'battle_arena'} onPress={() => resetTo('battle_select')} />
      <Nav icon="👤" label="Profile" active={screen === 'progress'} onPress={() => resetTo('progress')} />
    </View>
  );

  const Page = ({ children, nav = false }: { children: React.ReactNode; nav?: boolean }) => (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.page}>{children}</View>
      {nav && <Bottom />}
    </SafeAreaView>
  );

  if (loading) return <Page><View style={styles.loading}><ActivityIndicator color="#0BA84A" size="large" /><Text>Preparing your rainforest quest…</Text></View></Page>;

  // SCREEN: HOME
  if (screen === 'home') return (
    <Page nav>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBrandRow}>
          <Text style={styles.brand}>RimbaQuest</Text>
          <Tap label="View Profile" style={styles.avatarPill} onPress={() => open('progress')}>
            <Text style={styles.avatarEmoji}>{AVATAR_ICONS[currentUser.avatar] || '🦛'}</Text>
            <Text style={styles.avatarName}>{currentUser.display_name}</Text>
          </Tap>
        </View>

        {notice && <Text style={styles.notice}>{notice}</Text>}

        <View style={styles.hero}>
          <Text style={styles.level}>LV. {currentUser.level} JUNGLE SCOUT</Text>
          <Text style={styles.heroTitle}>Welcome, {currentUser.display_name}!</Text>
          <Text style={styles.heroCopy}>Every discovery helps protect{'\n'}Malaysia’s precious rainforest wildlife!</Text>
          <Text style={styles.mascot}>🌿</Text>
        </View>

        <View style={styles.stats}>
          <Stat value={`${displayProgress.found} / ${displayProgress.total}`} label="Wildlife Discovered" />
          <Stat value={`${displayProgress.xp}`} label="Explorer Points" />
        </View>

        <Section title="Begin Your Adventure" />
        <Quest number="1" title="Explore Wildlife Places" detail="Find where animals live in KL & Malaysia!" onPress={() => resetTo('locations')} />
        <Quest number="2" title="Record a Discovery" detail="Take a photo and log your sighting!" onPress={() => startDiscovery()} />
        <Quest number="3" title="Wildlife Card Battles" detail="Battle with your unlocked cards!" onPress={() => resetTo('battle_select')} />

        <Section title="Recent Captures" />
        {recentCaptures.length ? (
          <View style={styles.recentGrid}>
            {recentCaptures.map((capture) => (
              <View key={`${capture.id}-${capture.recorded_at}`} style={styles.recentItem}>
                <Image source={imageFor(capture) ?? IMAGES.recent} style={styles.recentImage} />
                <View style={styles.recentCopy}>
                  <Text style={styles.cardTitle}>{capture.common_name}</Text>
                  <Text style={styles.muted}>{capture.location_label || 'Kuala Lumpur, Malaysia'}</Text>
                  <Text style={styles.categoryPill}>{capture.category}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.recentEmpty}>
            <Text style={styles.muted}>Your latest confirmed discoveries will appear here.</Text>
          </View>
        )}
      </ScrollView>
    </Page>
  );

  // SCREEN: EXPLORE LOCATIONS (Epic 2)
  if (screen === 'locations') return (
    <Page nav>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="Wildlife Locations" back={false} />
        
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>🌿 Nature Explorer Safety Note</Text>
          <Text style={styles.disclaimerText}>
            Wildlife encounters depend on nature and cannot be guaranteed. Always observe from a safe distance and stay on designated park trails.
          </Text>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            placeholder="Search places by name or area (e.g. Gasing, FRIM)..."
            placeholderTextColor="#879089"
            value={locationSearch}
            onChangeText={setLocationSearch}
            autoCapitalize="none"
            style={styles.searchInput}
          />
          {locationSearch.length > 0 && (
            <Tap label="Clear" style={styles.searchClear} onPress={() => setLocationSearch('')}>
              <Text style={styles.searchClearText}>×</Text>
            </Tap>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {['All', ...categories].map((item) => (
            <Tap
              key={item}
              label={`Filter ${item}`}
              style={[styles.chip, locationCategoryFilter === item && styles.chipActive]}
              onPress={() => setLocationCategoryFilter(item)}
            >
              <Text style={[styles.chipText, locationCategoryFilter === item && styles.chipTextActive]}>
                {item === 'All' ? 'All Wildlife' : `${item}s`}
              </Text>
            </Tap>
          ))}
        </ScrollView>

        {filteredLocations.length ? (
          <View style={styles.locationList}>
            {filteredLocations.map((loc) => (
              <Tap
                key={loc.id}
                label={`View ${loc.name}`}
                style={styles.locationCard}
                onPress={() => { setSelectedLocation(loc); open('location_detail'); }}
              >
                <View style={styles.locationTopRow}>
                  <Text style={styles.locationName}>{loc.name}</Text>
                  <Text style={styles.distanceBadge}>{loc.distance_km} km</Text>
                </View>
                <Text style={styles.locationArea}>📍 {loc.area}</Text>
                <Text style={styles.locationDesc} numberOfLines={2}>{loc.description}</Text>
                {loc.typical_wildlife && (
                  <View style={styles.wildlifeTagRow}>
                    <Text style={styles.wildlifeTagLabel}>Typical Wildlife:</Text>
                    <Text style={styles.wildlifeTagValue}>{loc.typical_wildlife}</Text>
                  </View>
                )}
                <View style={styles.locationCardBottom}>
                  <Text style={styles.bestTimeText}>⏰ Best Time: {loc.best_time}</Text>
                  <Text style={styles.viewDetailText}>View Details ›</Text>
                </View>
              </Tap>
            ))}
          </View>
        ) : (
          <View style={styles.searchEmpty}>
            <Text style={styles.searchEmptyTitle}>No matching locations found</Text>
            <Text style={styles.muted}>Try clearing your search or choosing a different wildlife category.</Text>
          </View>
        )}
      </ScrollView>
    </Page>
  );

  // SCREEN: LOCATION DETAIL
  if (screen === 'location_detail' && selectedLocation) return (
    <Page nav>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title={selectedLocation.name} />
        <View style={styles.locationDetailHero}>
          <Text style={styles.locationAreaHero}>📍 {selectedLocation.area}</Text>
          <Text style={styles.locationTypeBadge}>{selectedLocation.type}</Text>
        </View>

        <Info label="ABOUT THIS LOCATION" value={selectedLocation.description} />
        <Info label="BEST TIME TO VISIT" value={selectedLocation.best_time} />
        <Info label="WHY EXPLORE HERE" value={selectedLocation.why_recommended} />
        {selectedLocation.typical_wildlife && <Info label="TYPICAL WILDLIFE SIGHTINGS" value={selectedLocation.typical_wildlife} />}

        {selectedLocation.facilities && selectedLocation.facilities.length > 0 && (
          <View style={styles.info}>
            <Text style={styles.infoLabel}>PARK FACILITIES</Text>
            <View style={styles.badges}>
              {selectedLocation.facilities.map((fac) => (
                <Text key={fac} style={styles.badge}>✓ {fac}</Text>
              ))}
            </View>
          </View>
        )}

        <Tap
          label="Record Discovery Here"
          style={styles.primary}
          onPress={() => startDiscovery(selectedLocation.name)}
        >
          <Text style={styles.primaryText}>📷 Record Wildlife Sighting Here</Text>
        </Tap>
      </ScrollView>
    </Page>
  );

  // SCREEN: PHOTO CAPTURE (Epic 3)
  if (screen === 'photo') return (
    <Page>
      <View style={styles.cameraPage}>
        {!cameraPermission ? (
          <View style={styles.cameraPermission}><ActivityIndicator color="#FFFFFF" size="large" /></View>
        ) : !cameraPermission.granted ? (
          <View style={styles.cameraPermission}>
            <Text style={styles.cameraTitle}>Camera access is needed to record your wildlife discovery.</Text>
            <Tap label="Allow camera" style={styles.primary} onPress={requestCameraPermission}>
              <Text style={styles.primaryText}>Allow Camera</Text>
            </Tap>
            <Tap label="Upload Photo from Device" style={styles.secondary} onPress={pickFromGallery}>
              <Text style={styles.secondaryText}>📁 Choose from Device Gallery</Text>
            </Tap>
            <Tap label="Use Sample Photo" style={styles.secondary} onPress={useSamplePhoto}>
              <Text style={styles.secondaryText}>Use Sample Wildlife Photo</Text>
            </Tap>
            <Tap label="Go back" style={styles.cameraBackButton} onPress={goBack}>
              <Text style={styles.cameraBackText}>Back</Text>
            </Tap>
          </View>
        ) : (
          <>
            <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" />
            <View style={styles.cameraOverlay}>
              <Tap label="Go back" style={styles.cameraBackButton} onPress={goBack}>
                <Text style={styles.cameraBackText}>‹</Text>
              </Tap>
              <Text style={styles.cameraBrand}>RimbaQuest Wildlife Camera</Text>
              <Text style={styles.cameraHint}>Point at wildlife & tap shutter to capture</Text>
              <Text style={styles.cameraPersonalRecord}>Photo is a personal record, not automated AI identification</Text>
              <View style={styles.cameraActionsRow}>
                <Tap label="Gallery" style={styles.samplePhotoButton} onPress={pickFromGallery}>
                  <Text style={styles.samplePhotoText}>📁 Gallery</Text>
                </Tap>
                <Tap label="Take photo" style={styles.shutter} onPress={takePhoto}>
                  <View style={styles.shutterInner} />
                </Tap>
                <Tap label="Sample Photo" style={styles.samplePhotoButton} onPress={useSamplePhoto}>
                  <Text style={styles.samplePhotoText}>Sample</Text>
                </Tap>
              </View>
            </View>
          </>
        )}
      </View>
    </Page>
  );

  // SCREEN: CHOOSE CATEGORY (Epic 3)
  if (screen === 'category') return (
    <Page>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="Record a Discovery" />
        <Image source={discoveryPhoto} style={styles.heroImage} />
        <Text style={styles.caption}>Your personal discovery photo</Text>
        <Text style={styles.pageTitle}>Choose a Wildlife Category</Text>
        <Text style={styles.subTitle}>What type of animal did you observe?</Text>
        <View style={styles.grid}>
          {categories.map((item) => (
            <Tap
              key={item}
              label={`Choose ${item}`}
              style={styles.categoryTile}
              onPress={() => { setCategory(item); setSpeciesSearch(''); open('species'); }}
            >
              <Image source={IMAGES[item as keyof typeof IMAGES]} style={styles.tileImage} />
              <View style={styles.tileShade} />
              <Text style={styles.tileLabel}>{item}s</Text>
            </Tap>
          ))}
        </View>
      </ScrollView>
    </Page>
  );

  // SCREEN: SELECT SPECIES (Epic 3)
  if (screen === 'species') return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.content}>
          <Header title="Record a Discovery" />
          <Image source={discoveryPhoto} style={styles.heroImage} />
          <Text style={styles.caption}>Your personal discovery photo</Text>
          <Text style={styles.pageTitle}>Which {category.toLowerCase()} did you see?</Text>
          <Text style={styles.subTitle}>Select the species that matches your observation</Text>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              placeholder="Search species name or scientific name..."
              placeholderTextColor="#879089"
              value={speciesSearch}
              onChangeText={setSpeciesSearch}
              autoCapitalize="none"
              style={styles.searchInput}
            />
            {speciesSearch.length > 0 && (
              <Tap label="Clear" style={styles.searchClear} onPress={() => setSpeciesSearch('')}>
                <Text style={styles.searchClearText}>×</Text>
              </Tap>
            )}
          </View>
          {filteredCategorySpecies.length ? (
            <View style={styles.grid}>
              {filteredCategorySpecies.map((item) => (
                <SpeciesCard key={item.id} item={item} onPress={() => chooseSpecies(item)} />
              ))}
            </View>
          ) : (
            <View style={styles.searchEmpty}>
              <Text style={styles.searchEmptyTitle}>No matching species found</Text>
              <Text style={styles.muted}>Try searching a different name or clear to see all {category}s.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );

  // SCREEN: CONFIRM DISCOVERY (Epic 3)
  if (screen === 'confirm') return (
    <Page>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="Confirm Discovery" />
        <Image source={discoveryPhoto} style={styles.confirmImage} />
        <Text style={styles.caption}>Your personal discovery photo</Text>
        <Text style={styles.pageTitle}>{selected.common_name} <Text style={styles.categoryPill}>{selected.category}</Text></Text>
        <Text style={styles.scientific}>{selected.scientific_name}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>OBSERVATION LOCATION</Text>
          <TextInput
            style={styles.textInput}
            value={discoveryLocation}
            onChangeText={setDiscoveryLocation}
            placeholder="Enter location (e.g. Bukit Gasing, FRIM)..."
          />
        </View>

        <Info label="DATE & TIME" value={new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })} />
        <Text style={styles.question}>Is this the species you saw?</Text>
        <Text style={styles.subTitle}>Double-check the photo and details before saving your discovery.</Text>
        
        <Tap label="Record my discovery" style={styles.primary} onPress={recordDiscovery}>
          <Text style={styles.primaryText}>Yes, Record My Discovery! (+100 XP)</Text>
        </Tap>
        <Tap label="Choose another species" style={styles.secondary} onPress={() => open('species')}>
          <Text style={styles.secondaryText}>Choose Another Species</Text>
        </Tap>
      </ScrollView>
    </Page>
  );

  // SCREEN: SUCCESS UNLOCK (Epic 4)
  if (screen === 'success') return (
    <Page>
      <ScrollView contentContainerStyle={[styles.content, styles.success]}>
        <View style={{ alignSelf: 'stretch' }}><Header title="Discovery Recorded" /></View>
        <Text style={styles.successSmall}>🎉 Awesome Work!</Text>
        <Text style={styles.successTitle}>New Wildlife Card Unlocked!</Text>
        <Text style={styles.level}>Level 1 · Discovered</Text>
        <Image source={imageFor(selected)!} style={styles.unlockImage} />
        <Text style={styles.pageTitle}>{selected.common_name}</Text>
        <Text style={styles.scientific}>{selected.scientific_name}</Text>
        <View style={styles.infoPair}>
          <Info label="LOCATION" value={discoveryLocation} />
          <Info label="STATUS" value="Confirmed" />
        </View>
        <Text style={styles.xp}>✨ +100 Explorer Experience Points</Text>
        <Tap label="View my card" style={[styles.primary, styles.fullWidth]} onPress={() => open('about')}>
          <Text style={styles.primaryText}>View Wildlife Card</Text>
        </Tap>
        <Tap label="Enter Card Battle" style={[styles.secondary, styles.fullWidth]} onPress={() => initBattle(selected)}>
          <Text style={styles.secondaryText}>⚔️ Battle With This Card!</Text>
        </Tap>
        <Tap label="View my collection" style={[styles.primary, styles.fullWidth]} onPress={() => resetTo('collection')}>
          <Text style={styles.primaryText}>View My Collection</Text>
        </Tap>
        <Tap label="Record another discovery" style={styles.textButton} onPress={() => resetTo('category')}>
          <Text style={styles.textButtonText}>Record Another Discovery</Text>
        </Tap>
      </ScrollView>
    </Page>
  );

  // SCREEN: MY COLLECTION (Epic 4)
  if (screen === 'collection') return (
    <Page nav>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="My Collection" back={false} />
        <ProgressCard progress={displayProgress} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {['All', ...categories].map((item) => (
            <Tap
              key={item}
              label={`Filter ${item}`}
              style={[styles.chip, filter === item && styles.chipActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>
                {item === 'All' ? 'All Wildlife' : `${item}s`}
              </Text>
            </Tap>
          ))}
        </ScrollView>
        <View style={styles.grid}>
          {visibleSpecies.map((item) =>
            discovered.includes(item.id) ? (
              <SpeciesCard key={item.id} item={item} onPress={() => { setSelected(item); open('about'); }} />
            ) : (
              <LockedCard key={item.id} item={item} onPress={() => { setSelected(item); open('locked'); }} />
            )
          )}
        </View>
      </ScrollView>
    </Page>
  );

  // SCREEN: SPECIES DETAIL TABS (About, Battle Stats, Facts, Gallery)
  if (screen === 'about' || screen === 'battle_stats' || screen === 'facts' || screen === 'gallery') return (
    <Page nav>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title={selected.common_name} />
        <View style={styles.tabs}>
          {([
            ['about', 'About'],
            ['battle_stats', 'Battle Stats'],
            ['facts', 'Fun Facts'],
            ['gallery', 'Gallery'],
          ] as [Screen, string][]).map(([key, label]) => (
            <Tap
              key={key}
              label={label}
              style={[styles.tab, screen === key && styles.tabActive]}
              onPress={() => open(key)}
            >
              <Text style={[styles.tabText, screen === key && styles.tabTextActive]}>{label}</Text>
            </Tap>
          ))}
        </View>

        {screen === 'about' && <About item={selected} />}
        {screen === 'battle_stats' && <BattleStatsTab item={selected} onBattle={() => initBattle(selected)} />}
        {screen === 'facts' && <Facts item={selected} onPlay={() => { void openQuiz(); }} />}
        {screen === 'gallery' && <Gallery photos={galleryPhotos[selected.id] ?? []} />}
      </ScrollView>
    </Page>
  );

  // SCREEN: QUIZ
  if (screen === 'quiz') return (
    <Page>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title={`${selected.common_name} Quiz`} />
        <Quiz item={selected} question={quizQuestion} answer={quizAnswer} onAnswer={setQuizAnswer} onDone={() => open('facts')} />
      </ScrollView>
    </Page>
  );

  // SCREEN: LOCKED SPECIES PREVIEW (AC4.1.8, AC4.1.9, AC4.1.10)
  if (screen === 'locked') return (
    <Page nav>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="Undiscovered Wildlife" />
        <View style={styles.lockedDetail}>
          <Image source={imageFor(selected)!} style={styles.lockedImage} />
          <Text style={styles.pageTitle}>{selected.common_name} <Text style={styles.categoryPill}>{selected.category}</Text></Text>
          <Text style={styles.scientific}>{selected.scientific_name}</Text>
          <Info label="HABITAT" value={selected.habitat} />
          <Info label="DISCOVERY HINT" value="Explore Malaysian nature parks or reserves safely to encounter and unlock this species!" />
          <View style={styles.lockedWarningBox}>
            <Text style={styles.lockedWarningTitle}>🔒 Detailed Card Info Locked</Text>
            <Text style={styles.lockedWarningText}>
              Fun facts, battle abilities, diet details, and personal observation galleries unlock once you record your first confirmed sighting!
            </Text>
          </View>
          <Tap label="Record discovery" style={styles.primary} onPress={() => { setSelected(selected); startDiscovery(); }}>
            <Text style={styles.primaryText}>📷 Record Sighting to Unlock</Text>
          </Tap>
        </View>
      </ScrollView>
    </Page>
  );

  // SCREEN: CARD BATTLE SELECTION (Epic 8)
  if (screen === 'battle_select') return (
    <Page nav>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="Wildlife Card Battles" back={false} />
        <View style={styles.battleHero}>
          <Text style={styles.battleHeroTitle}>⚔️ Rainforest Battle Arena</Text>
          <Text style={styles.battleHeroCopy}>
            Select one of your discovered Wildlife Cards to test its strength against wild forest challengers!
          </Text>
        </View>

        <Section title="Select Your Battle Card" />
        {unlockedSpeciesList.length > 0 ? (
          <View style={styles.grid}>
            {unlockedSpeciesList.map((item) => (
              <Tap
                key={item.id}
                label={`Select ${item.common_name}`}
                style={[styles.battleCardSelect, battlePlayerCard?.id === item.id && styles.battleCardSelectActive]}
                onPress={() => initBattle(item)}
              >
                <Image source={imageFor(item)!} style={styles.battleCardImage} />
                <Text style={styles.cardTitle} numberOfLines={1}>{item.common_name}</Text>
                <View style={styles.battleStatsRow}>
                  <Text style={styles.hpBadge}>❤️ {item.hp || 120} HP</Text>
                  <Text style={styles.atkBadge}>⚔️ {item.base_attack || 25} ATK</Text>
                </View>
                <View style={styles.battleButtonSmall}>
                  <Text style={styles.battleButtonSmallText}>Choose & Battle ›</Text>
                </View>
              </Tap>
            ))}
          </View>
        ) : (
          <View style={styles.searchEmpty}>
            <Text style={styles.searchEmptyTitle}>No unlocked Wildlife Cards yet!</Text>
            <Text style={styles.muted}>Record your first wildlife discovery to unlock cards for battle.</Text>
            <Tap label="Record discovery" style={styles.primary} onPress={() => startDiscovery()}>
              <Text style={styles.primaryText}>📷 Record a Discovery</Text>
            </Tap>
          </View>
        )}
      </ScrollView>
    </Page>
  );

  // SCREEN: BATTLE ARENA (Epic 8)
  if (screen === 'battle_arena' && battlePlayerCard) return (
    <Page>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="Battle in Progress" />

        {/* Opponent Arena Box */}
        <View style={styles.arenaOpponentBox}>
          <View style={styles.arenaHeaderRow}>
            <Text style={styles.arenaOpponentName}>🐗 {battleOpponentName}</Text>
            <Text style={styles.arenaHpText}>{battleOpponentHp} / {battleOpponentMaxHp} HP</Text>
          </View>
          <View style={styles.hpTrack}>
            <View style={[styles.hpFillOpponent, { width: `${(battleOpponentHp / battleOpponentMaxHp) * 100}%` }]} />
          </View>
        </View>

        <Text style={styles.arenaVsText}>⚡ VS ⚡</Text>

        {/* Player Arena Box */}
        <View style={styles.arenaPlayerBox}>
          <View style={styles.arenaHeaderRow}>
            <Text style={styles.arenaPlayerName}>🐾 {battlePlayerCard.common_name}</Text>
            <Text style={styles.arenaHpText}>{battlePlayerHp} / {battlePlayerMaxHp} HP</Text>
          </View>
          <View style={styles.hpTrack}>
            <View style={[styles.hpFillPlayer, { width: `${(battlePlayerHp / battlePlayerMaxHp) * 100}%` }]} />
          </View>
          <View style={styles.battleStatsRow}>
            <Text style={styles.categoryPill}>{battlePlayerCard.category}</Text>
            <Text style={styles.atkBadge}>Base ATK: {battlePlayerCard.base_attack || 25}</Text>
          </View>
        </View>

        {/* Battle Logs */}
        <View style={styles.battleLogBox}>
          <Text style={styles.battleLogTitle}>📜 Battle Log (Round {battleRound})</Text>
          {battleLog.slice(-4).map((log, idx) => (
            <Text key={idx} style={styles.battleLogText}>{log}</Text>
          ))}
        </View>

        {/* Combat Actions */}
        {battleOutcome === 'playing' ? (
          <View style={styles.battleActions}>
            <Tap
              label="Basic Attack"
              style={[styles.primary, isAttacking && styles.buttonDisabled]}
              disabled={isAttacking}
              onPress={performAttack}
            >
              <Text style={styles.primaryText}>
                {isAttacking ? 'Attacking...' : `⚔️ Basic Strike (${battlePlayerCard.base_attack || 25} ATK)`}
              </Text>
            </Tap>
            <View style={styles.lockedAbilityNotice}>
              <Text style={styles.lockedAbilityNoticeText}>
                🔒 Special Abilities unlock in Iteration 2 via Species Quizzes!
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.battleOutcomeBox}>
            <Text style={styles.battleOutcomeTitle}>
              {battleOutcome === 'win' ? '🎉 VICTORY! (+50 XP)' : '💔 DEFEATED (+10 XP)'}
            </Text>
            <Text style={styles.battleOutcomeCopy}>
              {battleOutcome === 'win'
                ? 'Your wildlife card fought bravely and protected the rainforest!'
                : 'Good effort! Train your wildlife cards and try again!'}
            </Text>
            <Tap label="Battle Again" style={styles.primary} onPress={() => initBattle(battlePlayerCard)}>
              <Text style={styles.primaryText}>🔄 Battle Again</Text>
            </Tap>
            <Tap label="Choose Another Card" style={styles.secondary} onPress={() => resetTo('battle_select')}>
              <Text style={styles.secondaryText}>Choose Another Card</Text>
            </Tap>
          </View>
        )}
      </ScrollView>
    </Page>
  );

  // SCREEN: AUTH (LOGIN & REGISTER) (Epic 1)
  if (screen === 'auth') return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Header title={authMode === 'login' ? 'Log In to RimbaQuest' : 'Create Your Account'} />

        <View style={styles.authTabRow}>
          <Tap label="Login Tab" style={[styles.authTab, authMode === 'login' && styles.authTabActive]} onPress={() => { setAuthMode('login'); setAuthError(null); }}>
            <Text style={[styles.authTabText, authMode === 'login' && styles.authTabTextActive]}>Log In</Text>
          </Tap>
          <Tap label="Register Tab" style={[styles.authTab, authMode === 'register' && styles.authTabActive]} onPress={() => { setAuthMode('register'); setAuthError(null); }}>
            <Text style={[styles.authTabText, authMode === 'register' && styles.authTabTextActive]}>Create Account</Text>
          </Tap>
        </View>

        {authError && <Text style={styles.authError}>{authError}</Text>}

        {authMode === 'register' ? (
          <View style={styles.authForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>USERNAME * (3–20 characters, no spaces)</Text>
              <TextInput style={styles.textInput} placeholder="e.g. jungle_scout" value={authUsername} onChangeText={setAuthUsername} autoCapitalize="none" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>AGE * (8–12 recommended)</Text>
              <TextInput style={styles.textInput} placeholder="e.g. 10" value={authAge} onChangeText={setAuthAge} keyboardType="numeric" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
              <TextInput style={styles.textInput} placeholder="e.g. scout@rimbaquest.my" value={authEmail} onChangeText={setAuthEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD * (min. 6 characters)</Text>
              <TextInput style={styles.textInput} placeholder="Create password" value={authPassword} onChangeText={setAuthPassword} secureTextEntry />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD *</Text>
              <TextInput style={styles.textInput} placeholder="Repeat password" value={authConfirmPassword} onChangeText={setAuthConfirmPassword} secureTextEntry />
            </View>

            <Text style={styles.inputLabel}>CHOOSE YOUR EXPLORER AVATAR</Text>
            <View style={styles.avatarPicker}>
              {Object.entries(AVATAR_ICONS).map(([key, emoji]) => (
                <Tap key={key} label={key} style={[styles.avatarChoice, authAvatar === key && styles.avatarChoiceActive]} onPress={() => setAuthAvatar(key)}>
                  <Text style={styles.avatarChoiceEmoji}>{emoji}</Text>
                  <Text style={styles.avatarChoiceName}>{key}</Text>
                </Tap>
              ))}
            </View>

            <Tap label="Create Account" style={styles.primary} onPress={handleRegister}>
              <Text style={styles.primaryText}>Create RimbaQuest Account</Text>
            </Tap>
          </View>
        ) : (
          <View style={styles.authForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>USERNAME OR EMAIL *</Text>
              <TextInput style={styles.textInput} placeholder="Enter your username or email" value={authUsername} onChangeText={setAuthUsername} autoCapitalize="none" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD *</Text>
              <TextInput style={styles.textInput} placeholder="Enter password" value={authPassword} onChangeText={setAuthPassword} secureTextEntry />
            </View>

            <Tap label="Log In" style={styles.primary} onPress={handleLogin}>
              <Text style={styles.primaryText}>Log In</Text>
            </Tap>

            <Tap label="Forgot Password" style={styles.textButton} onPress={() => { setForgotStep(1); open('forgot_password'); }}>
              <Text style={styles.textButtonText}>Forgot your password?</Text>
            </Tap>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  // SCREEN: FORGOT PASSWORD (Epic 1)
  if (screen === 'forgot_password') return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="Recover Account Access" />
        {forgotStep === 1 ? (
          <View style={styles.authForm}>
            <Text style={styles.subTitle}>Enter the email address associated with your RimbaQuest account.</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
              <TextInput style={styles.textInput} placeholder="scout@rimbaquest.my" value={forgotEmail} onChangeText={setForgotEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>
            <Tap label="Request Reset" style={styles.primary} onPress={() => { setForgotToken('RESET-2026'); setForgotStep(2); }}>
              <Text style={styles.primaryText}>Send Recovery Code</Text>
            </Tap>
          </View>
        ) : (
          <View style={styles.authForm}>
            <Text style={styles.subTitle}>Recovery code sent! Please enter the code and your new password.</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>RECOVERY CODE *</Text>
              <TextInput style={styles.textInput} value={forgotToken} onChangeText={setForgotToken} placeholder="e.g. RESET-2026" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NEW PASSWORD *</Text>
              <TextInput style={styles.textInput} value={forgotNewPassword} onChangeText={setForgotNewPassword} placeholder="New password" secureTextEntry />
            </View>
            <Tap label="Reset Password" style={styles.primary} onPress={() => { alert('Password successfully updated!'); open('auth'); }}>
              <Text style={styles.primaryText}>Reset Password & Log In</Text>
            </Tap>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  // SCREEN: EDIT PROFILE (Epic 1)
  if (screen === 'profile_edit') return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="Edit Profile" />
        <View style={styles.authForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>DISPLAY NAME</Text>
            <TextInput style={styles.textInput} value={editDisplayName} onChangeText={setEditDisplayName} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>AGE</Text>
            <TextInput style={styles.textInput} value={editAge} onChangeText={setEditAge} keyboardType="numeric" />
          </View>
          <Text style={styles.inputLabel}>CHOOSE AVATAR</Text>
          <View style={styles.avatarPicker}>
            {Object.entries(AVATAR_ICONS).map(([key, emoji]) => (
              <Tap key={key} label={key} style={[styles.avatarChoice, editAvatar === key && styles.avatarChoiceActive]} onPress={() => setEditAvatar(key)}>
                <Text style={styles.avatarChoiceEmoji}>{emoji}</Text>
                <Text style={styles.avatarChoiceName}>{key}</Text>
              </Tap>
            ))}
          </View>
          <Tap label="Save Changes" style={styles.primary} onPress={handleSaveProfile}>
            <Text style={styles.primaryText}>Save Profile Changes</Text>
          </Tap>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // SCREEN: PROFILE & PROGRESS (Epic 1 & Epic 4)
  return (
    <Page nav>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="My Explorer Profile" back={false} />
        
        {/* User Card */}
        <View style={styles.profileHero}>
          <Text style={styles.profileHeroAvatar}>{AVATAR_ICONS[currentUser.avatar] || '🦛'}</Text>
          <View style={styles.profileHeroInfo}>
            <Text style={styles.profileHeroName}>{currentUser.display_name}</Text>
            <Text style={styles.profileHeroBand}>Age {currentUser.age} · Level {currentUser.level} Jungle Scout</Text>
          </View>
          <Tap label="Edit Profile" style={styles.editProfileBtn} onPress={() => { setEditDisplayName(currentUser.display_name); setEditAvatar(currentUser.avatar); setEditAge(String(currentUser.age)); open('profile_edit'); }}>
            <Text style={styles.editProfileBtnText}>✏️ Edit</Text>
          </Tap>
        </View>

        <ProgressCard progress={displayProgress} />

        <Section title="CATEGORY COLLECTION PROGRESS" />
        {categories.map((item) => {
          const items = supportedSpecies.filter((speciesItem) => speciesItem.category === item);
          const found = items.filter((speciesItem) => discovered.includes(speciesItem.id)).length;
          return (
            <View style={styles.progressRow} key={item}>
              <Text style={styles.cardTitle}>{item}s</Text>
              <Text style={styles.muted}>{found} / {items.length} Discovered</Text>
            </View>
          );
        })}

        <Section title="ACHIEVEMENTS & BADGES" />
        <View style={styles.badges}>
          <Text style={styles.badge}>🏅 First Discovery</Text>
          <Text style={styles.badge}>🌱 Wildlife Friend</Text>
          <Text style={styles.badge}>⚔️ Battle Rookie</Text>
          <Text style={styles.badge}>🦉 Forest Scholar</Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <Tap label="Switch Account / Log In" style={styles.secondary} onPress={() => open('auth')}>
            <Text style={styles.secondaryText}>🔐 Switch Account / Log In</Text>
          </Tap>
        </View>
      </ScrollView>
    </Page>
  );
}

// Sub-components
function Tap({ children, onPress, style, label, disabled = false }: { children: React.ReactNode; onPress: () => void; style?: object | object[]; label: string; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} onPress={onPress} style={({ pressed }) => [style, pressed && !disabled && styles.pressed]}>
      {children}
    </Pressable>
  );
}

function Nav({ icon, label, onPress, active = false, disabled = false }: { icon: string; label: string; onPress: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <Tap label={label} onPress={onPress} disabled={disabled} style={styles.navItem}>
      <Text style={[styles.navIcon, active && styles.navActive, disabled && styles.navDisabled]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.navActive, disabled && styles.navDisabled]}>{label}</Text>
    </Tap>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, right }: { title: string; right?: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right && <Text style={styles.seeAll}>{right}</Text>}
    </View>
  );
}

function Quest({ number, title, detail, onPress }: { number: string; title: string; detail: string; onPress: () => void }) {
  return (
    <Tap label={title} style={styles.quest} onPress={onPress}>
      <Text style={styles.questNumber}>{number}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.muted}>{detail}</Text>
      </View>
    </Tap>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SpeciesCard({ item, onPress }: { item: Species; onPress: () => void }) {
  return (
    <Tap label={`View ${item.common_name}`} style={styles.speciesCard} onPress={onPress}>
      <Image source={imageFor(item)!} style={styles.speciesImage} />
      <Text numberOfLines={1} style={styles.cardTitle}>{item.common_name}</Text>
      <View style={styles.cardBottomRow}>
        <Text style={styles.categoryText}>{item.category}</Text>
        <Text style={styles.hpBadgeMini}>❤️ {item.hp || 120}</Text>
      </View>
    </Tap>
  );
}

function LockedCard({ item, onPress }: { item: Species; onPress: () => void }) {
  return (
    <Tap label={`Preview undiscovered ${item.common_name}`} style={styles.speciesCard} onPress={onPress}>
      <Image source={imageFor(item)!} style={[styles.speciesImage, styles.lockedSpeciesImage]} />
      <View style={styles.lockedOverlay}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.lockedLabel}>UNDISCOVERED</Text>
      </View>
      <Text numberOfLines={1} style={styles.cardTitle}>{item.common_name}</Text>
      <Text style={styles.muted}>{item.category}</Text>
    </Tap>
  );
}

function ProgressCard({ progress }: { progress: { found: number; total: number; xp: number; level?: number } }) {
  const percentage = progress.total ? Math.min(100, Math.round((progress.found / progress.total) * 100)) : 0;
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressTop}>
        <View>
          <Text style={styles.infoLabel}>OVERALL COLLECTION PROGRESS</Text>
          <Text style={styles.progressValue}>{progress.found} / {progress.total}</Text>
        </View>
        <Text style={styles.unlocked}>{percentage}% Unlocked</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
      <View style={styles.infoPair}>
        <Info label="EXPLORER POINTS" value={`${progress.xp} XP`} />
        <Info label="SCOUT RANK" value={`Level ${progress.level || 1}`} />
      </View>
    </View>
  );
}

function ecologicalRole(item: Species) {
  if (item.category === 'Butterfly') return 'Helps pollinate flowering plants while moving between gardens and forest edges.';
  if (item.category === 'Bird') return 'Helps spread seeds and supports a healthy rainforest food web.';
  if (item.category === 'Reptile') return 'Helps keep the food web in balance as part of its wetland and forest habitat.';
  return 'Plays an important role in Malaysia’s forest food web and healthy habitat.';
}

function About({ item }: { item: Species }) {
  return (
    <>
      <View style={styles.badges}>
        <Text style={styles.badge}>Level 1 · Discovered</Text>
        <Text style={styles.badge}>{item.category}</Text>
      </View>
      <Info label="SCIENTIFIC NAME" value={item.scientific_name} />
      {item.act716_status && <Info label="MALAYSIAN LEGAL PROTECTION" value={item.act716_status} />}
      <Info label="HABITAT" value={item.habitat} />
      <Info label="DIET" value={item.diet} />
      <Info label="ECOLOGICAL ROLE" value={ecologicalRole(item)} />
      <Info label="RESPONSIBLE OBSERVATION" value="Always observe wildlife from a respectful distance without feeding, touching or making loud noises." />
    </>
  );
}

function BattleStatsTab({ item, onBattle }: { item: Species; onBattle: () => void }) {
  return (
    <View style={styles.battleStatsContainer}>
      <View style={styles.battleStatHeader}>
        <Text style={styles.battleStatHeaderTitle}>Card Combat Attributes</Text>
        <View style={styles.stats}>
          <Stat value={`❤️ ${item.hp || 120}`} label="Base HP" />
          <Stat value={`⚔️ ${item.base_attack || 25}`} label="Base Attack" />
        </View>
      </View>

      <Section title="SPECIAL ABILITIES (Iteration 2)" />
      {[
        item.ability_1 || 'Swift Pounce',
        item.ability_2 || 'Wild Roar',
        item.ability_3 || 'Guardian Guard',
      ].map((ability, idx) => (
        <View key={idx} style={styles.abilitySlotLocked}>
          <Text style={styles.abilitySlotIcon}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.abilitySlotName}>Ability {idx + 1}: {ability}</Text>
            <Text style={styles.abilitySlotHint}>Unlocked by completing Species Quiz {idx + 1} in Iteration 2!</Text>
          </View>
        </View>
      ))}

      <Tap label="Battle with Card" style={styles.primary} onPress={onBattle}>
        <Text style={styles.primaryText}>⚔️ Enter Card Battle</Text>
      </Tap>
    </View>
  );
}

function Facts({ item, onPlay }: { item: Species; onPlay: () => void }) {
  return (
    <>
      <View style={styles.quiz}>
        <Text style={styles.quizLabel}>KNOWLEDGE QUIZ</Text>
        <Text style={styles.quizTitle}>Test Your Rainforest Knowledge!</Text>
        <Text style={styles.muted}>Answer a quiz question about {item.common_name} to test what you learned!</Text>
        <Tap label="Play quiz" style={styles.quizButton} onPress={onPlay}>
          <Text style={styles.primaryText}>▶ Play Quiz</Text>
        </Tap>
      </View>
      <Section title="Species Fun Facts" />
      {[item.fun_fact, 'Wild animals need peaceful space to thrive in their natural habitat.', 'Every observation recorded contributes to wildlife appreciation!'].map((fact, idx) => (
        <Text key={idx} style={styles.fact}>• {fact}</Text>
      ))}
    </>
  );
}

function Quiz({ item, question, answer, onAnswer, onDone }: { item: Species; question: QuizQuestion | null; answer: number | null; onAnswer: (index: number) => void; onDone: () => void }) {
  const activeQuestion = question ?? { question: `Which statement about ${item.common_name} is true?`, options: [item.fun_fact], correct_index: 0 };
  const correct = answer === activeQuestion.correct_index;
  return (
    <View style={styles.quiz}>
      <Text style={styles.quizLabel}>QUESTION 1 OF 1</Text>
      <Text style={styles.quizTitle}>{activeQuestion.question}</Text>
      {activeQuestion.options.map((option, index) => (
        <Tap key={`${option}-${index}`} label={`Answer ${index + 1}`} style={[styles.secondary, styles.quizOption, answer === index && styles.quizOptionSelected]} onPress={() => onAnswer(index)}>
          <Text style={[styles.secondaryText, styles.quizOptionText, answer === index && styles.quizOptionTextSelected]}>{option}</Text>
        </Tap>
      ))}
      {answer !== null && (
        <>
          <Text style={styles.hint}>{correct ? '🎉 Great job! That is correct.' : (activeQuestion.explanation || 'Not quite. Read the fun facts and try again!')}</Text>
          <Tap label="Return to fun facts" style={styles.primary} onPress={onDone}>
            <Text style={styles.primaryText}>Back to Fun Facts</Text>
          </Tap>
        </>
      )}
    </View>
  );
}

function Gallery({ photos }: { photos: string[] }) {
  return (
    <>
      <Text style={styles.subTitle}>Your past personal discovery photos for this species.</Text>
      {photos.length ? (
        <View style={styles.gallery}>
          {photos.map((uri, index) => (
            <Image key={`${uri}-${index}`} source={{ uri }} style={styles.galleryImage} />
          ))}
        </View>
      ) : (
        <View style={styles.galleryEmpty}>
          <Text style={styles.galleryEmptyTitle}>No personal photos yet</Text>
          <Text style={styles.muted}>Record this species again to add another photo to its gallery.</Text>
        </View>
      )}
    </>
  );
}

const styles: any = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  page: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: 520, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 110 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  topBrandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 14 },
  brand: { fontSize: 24, fontWeight: '900', color: '#182019' },
  avatarPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDF5EF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  avatarEmoji: { fontSize: 18 },
  avatarName: { fontSize: 12, fontWeight: '800', color: '#087B35' },
  notice: { color: '#8B5D00', backgroundColor: '#FFF7DD', borderRadius: 10, padding: 10, fontSize: 12, marginBottom: 10 },
  hero: { minHeight: 155, borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 22, padding: 18, position: 'relative', overflow: 'hidden', backgroundColor: '#FAFCFA' },
  level: { alignSelf: 'flex-start', overflow: 'hidden', color: '#087B35', backgroundColor: '#DFF6E7', fontSize: 10, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  heroTitle: { color: '#1B211C', fontSize: 26, lineHeight: 30, fontWeight: '900', marginTop: 10 },
  heroCopy: { color: '#66706A', fontSize: 13, lineHeight: 20, marginTop: 8 },
  mascot: { position: 'absolute', right: 14, bottom: 14, fontSize: 44 },
  stats: { flexDirection: 'row', gap: 12, marginVertical: 16 },
  stat: { flex: 1, borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 18, padding: 14, backgroundColor: '#FFFFFF' },
  statValue: { color: '#0BA84A', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#66706A', fontSize: 11, marginTop: 4, fontWeight: '700' },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1B211C' },
  seeAll: { color: '#0BA84A', fontSize: 12, fontWeight: '700' },
  quest: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F4F1' },
  questNumber: { width: 32, height: 32, lineHeight: 32, textAlign: 'center', color: '#FFFFFF', backgroundColor: '#35B85E', borderRadius: 16, fontWeight: '900' },
  cardTitle: { color: '#1B211C', fontSize: 14, fontWeight: '800', marginTop: 6, paddingHorizontal: 6 },
  muted: { color: '#707872', fontSize: 11, marginTop: 2, paddingHorizontal: 6 },
  recentGrid: { gap: 10, marginTop: 6 },
  recentItem: { borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#FFFFFF' },
  recentImage: { width: 70, height: 70, borderRadius: 10 },
  recentCopy: { marginLeft: 12, flex: 1 },
  recentEmpty: { borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 14, padding: 18, alignItems: 'center', backgroundColor: '#FAFCFA' },
  header: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1B211C', flex: 1, textAlign: 'center' },
  back: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#DFE7E1', alignItems: 'center', justifyContent: 'center' },
  backSpacer: { width: 38 },
  backText: { fontSize: 30, color: '#1B211C', lineHeight: 32 },
  heroImage: { width: 145, height: 145, borderRadius: 18, alignSelf: 'center', marginBottom: 6 },
  confirmImage: { width: 170, height: 170, borderRadius: 18, alignSelf: 'center', marginBottom: 14 },
  caption: { color: '#69716B', fontSize: 11, textAlign: 'center', marginBottom: 16 },
  pageTitle: { color: '#1B211C', fontSize: 22, lineHeight: 26, fontWeight: '900', marginTop: 4 },
  subTitle: { color: '#68716C', fontSize: 13, lineHeight: 18, marginTop: 6, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryTile: { width: '48%', height: 145, borderRadius: 18, overflow: 'hidden', position: 'relative', backgroundColor: '#E4E8E5' },
  tileImage: { width: '100%', height: '100%' },
  tileShade: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '40%', backgroundColor: 'rgba(0,0,0,0.5)' },
  tileLabel: { position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center', color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  speciesCard: { width: '48%', minHeight: 165, borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 16, overflow: 'hidden', paddingBottom: 8, backgroundColor: '#FFFFFF' },
  speciesImage: { width: '100%', height: 96 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6, marginTop: 4 },
  categoryText: { color: '#0BA84A', fontSize: 10, fontWeight: '700' },
  hpBadgeMini: { color: '#D9383A', fontSize: 10, fontWeight: '800' },
  lockedSpeciesImage: { opacity: 0.28 },
  lockedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 96, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  lockIcon: { fontSize: 20 },
  lockedLabel: { color: '#68716C', fontSize: 9, fontWeight: '900', marginTop: 2 },
  categoryPill: { fontSize: 10, color: '#087B35', backgroundColor: '#DFF6E7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden', alignSelf: 'flex-start' },
  info: { borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 14, padding: 12, marginTop: 10, backgroundColor: '#FFFFFF' },
  infoLabel: { color: '#78817B', fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  infoValue: { color: '#1B211C', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 4 },
  inputGroup: { marginTop: 12 },
  inputLabel: { color: '#566159', fontSize: 10, fontWeight: '800', marginBottom: 5 },
  textInput: { borderWidth: 1, borderColor: '#C8D1CA', borderRadius: 12, paddingHorizontal: 12, minHeight: 44, fontSize: 14, color: '#1B211C', backgroundColor: '#FFFFFF' },
  question: { color: '#1B211C', fontSize: 14, fontWeight: '800', marginTop: 16 },
  primary: { minHeight: 48, marginTop: 14, borderRadius: 24, backgroundColor: '#0BA84A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondary: { minHeight: 46, marginTop: 9, borderRadius: 23, backgroundColor: '#FFFFFF', borderColor: '#C8D1CA', borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  secondaryText: { color: '#1B211C', fontSize: 13, fontWeight: '700' },
  success: { alignItems: 'center', paddingTop: 20 },
  successSmall: { color: '#1B211C', fontSize: 16, fontWeight: '800' },
  successTitle: { color: '#0BA84A', fontSize: 22, fontWeight: '900', marginTop: 6 },
  unlockImage: { width: 125, height: 125, borderRadius: 16, marginVertical: 12 },
  scientific: { color: '#68716C', fontStyle: 'italic', fontSize: 12, marginTop: 3 },
  infoPair: { flexDirection: 'row', alignSelf: 'stretch', gap: 8, marginTop: 6 },
  xp: { alignSelf: 'stretch', color: '#087B35', borderWidth: 1, borderColor: '#CBECD6', backgroundColor: '#F4FFF7', borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: '800', padding: 10, marginTop: 12 },
  textButton: { paddingVertical: 12, alignItems: 'center' },
  textButtonText: { color: '#0BA84A', fontWeight: '800', fontSize: 13 },
  progressCard: { borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12, backgroundColor: '#FFFFFF' },
  progressTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  progressValue: { fontSize: 22, color: '#1B211C', fontWeight: '900', marginTop: 3 },
  unlocked: { color: '#0BA84A', fontSize: 12, fontWeight: '800' },
  track: { height: 8, backgroundColor: '#E8EEEA', borderRadius: 4, overflow: 'hidden', marginTop: 12 },
  fill: { height: '100%', backgroundColor: '#0BA84A', borderRadius: 4 },
  chips: { gap: 8, paddingBottom: 12 },
  chip: { borderRadius: 16, backgroundColor: '#F0F4F1', paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: '#0BA84A' },
  chipText: { fontSize: 11, color: '#607068', fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  tabs: { flexDirection: 'row', gap: 14, borderBottomWidth: 1, borderBottomColor: '#E2E7E3', marginBottom: 14 },
  tab: { paddingVertical: 9, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#0BA84A' },
  tabText: { color: '#6A736D', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#0BA84A', fontWeight: '900' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  badge: { color: '#31613F', backgroundColor: '#EDF5EF', borderRadius: 14, fontSize: 10, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 6, overflow: 'hidden' },
  quiz: { borderColor: '#CBECD6', borderWidth: 1, backgroundColor: '#F4FFF7', borderRadius: 16, padding: 14 },
  quizLabel: { color: '#087B35', fontSize: 10, fontWeight: '800' },
  quizTitle: { fontSize: 17, color: '#1B211C', fontWeight: '800', marginTop: 4 },
  quizButton: { backgroundColor: '#0BA84A', alignSelf: 'flex-start', borderRadius: 16, marginTop: 12, paddingVertical: 8, paddingHorizontal: 14 },
  fact: { color: '#273229', fontSize: 12, lineHeight: 18, borderBottomWidth: 1, borderBottomColor: '#E6EAE7', paddingVertical: 10 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  galleryImage: { width: '48%', height: 130, borderRadius: 12 },
  lockedDetail: { borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 20, padding: 14, backgroundColor: '#FFFFFF' },
  lockedImage: { width: '100%', height: 210, borderRadius: 14, opacity: 0.5 },
  lockedWarningBox: { borderWidth: 1, borderColor: '#F5C6CB', backgroundColor: '#FFF3CD', borderRadius: 12, padding: 12, marginTop: 12 },
  lockedWarningTitle: { color: '#856404', fontSize: 12, fontWeight: '800' },
  lockedWarningText: { color: '#856404', fontSize: 11, lineHeight: 16, marginTop: 4 },
  hint: { color: '#117B3A', backgroundColor: '#F0FAF3', borderColor: '#CBECD6', borderWidth: 1, borderRadius: 10, fontSize: 11, lineHeight: 16, padding: 10, marginTop: 12 },
  progressRow: { borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, backgroundColor: '#FFFFFF' },
  
  // Locations Styling
  disclaimerBox: { borderWidth: 1, borderColor: '#BEE5EB', backgroundColor: '#E2F0D9', borderRadius: 14, padding: 12, marginBottom: 12 },
  disclaimerTitle: { color: '#1E4620', fontSize: 12, fontWeight: '800' },
  disclaimerText: { color: '#2C5E2E', fontSize: 11, lineHeight: 16, marginTop: 3 },
  locationList: { gap: 12 },
  locationCard: { borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 16, padding: 14, backgroundColor: '#FFFFFF' },
  locationTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  locationName: { color: '#1B211C', fontSize: 15, fontWeight: '800', flex: 1 },
  distanceBadge: { color: '#0BA84A', backgroundColor: '#EAF8EF', borderRadius: 10, fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  locationArea: { color: '#68716C', fontSize: 11, fontWeight: '700', marginTop: 3 },
  locationDesc: { color: '#525B55', fontSize: 12, lineHeight: 17, marginTop: 6 },
  wildlifeTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8, alignItems: 'center' },
  wildlifeTagLabel: { fontSize: 10, color: '#7B857F', fontWeight: '800' },
  wildlifeTagValue: { fontSize: 10, color: '#087B35', fontWeight: '700' },
  locationCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F4F1' },
  bestTimeText: { fontSize: 10, color: '#7B857F' },
  viewDetailText: { fontSize: 11, color: '#0BA84A', fontWeight: '800' },
  locationDetailHero: { backgroundColor: '#F4FAF6', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center' },
  locationAreaHero: { fontSize: 14, fontWeight: '800', color: '#1B211C' },
  locationTypeBadge: { fontSize: 11, color: '#0BA84A', fontWeight: '700', marginTop: 4 },

  // Battle Styling
  battleHero: { backgroundColor: '#FDF4E7', borderColor: '#F5DEB3', borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 14 },
  battleHeroTitle: { color: '#8A4B08', fontSize: 16, fontWeight: '900' },
  battleHeroCopy: { color: '#8A4B08', fontSize: 12, lineHeight: 17, marginTop: 4 },
  battleCardSelect: { width: '48%', borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 16, overflow: 'hidden', padding: 6, backgroundColor: '#FFFFFF' },
  battleCardSelectActive: { borderColor: '#0BA84A', borderWidth: 2 },
  battleCardImage: { width: '100%', height: 90, borderRadius: 10 },
  battleStatsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 6 },
  hpBadge: { fontSize: 10, fontWeight: '800', color: '#D9383A', backgroundColor: '#FCE8E8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  atkBadge: { fontSize: 10, fontWeight: '800', color: '#B36200', backgroundColor: '#FFF2DF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  battleButtonSmall: { backgroundColor: '#0BA84A', borderRadius: 8, paddingVertical: 6, alignItems: 'center', marginTop: 6 },
  battleButtonSmallText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

  // Battle Arena Styling
  arenaOpponentBox: { borderWidth: 1, borderColor: '#F5C6CB', backgroundColor: '#FFF5F5', borderRadius: 16, padding: 14 },
  arenaPlayerBox: { borderWidth: 1, borderColor: '#CBECD6', backgroundColor: '#F4FFF7', borderRadius: 16, padding: 14 },
  arenaHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arenaOpponentName: { color: '#8C1D24', fontSize: 15, fontWeight: '900' },
  arenaPlayerName: { color: '#087B35', fontSize: 15, fontWeight: '900' },
  arenaHpText: { fontSize: 12, fontWeight: '800', color: '#1B211C' },
  hpTrack: { height: 10, backgroundColor: '#E0E6E2', borderRadius: 5, overflow: 'hidden', marginTop: 8 },
  hpFillOpponent: { height: '100%', backgroundColor: '#D9383A' },
  hpFillPlayer: { height: '100%', backgroundColor: '#0BA84A' },
  arenaVsText: { textAlign: 'center', fontSize: 16, fontWeight: '900', color: '#879089', marginVertical: 8 },
  battleLogBox: { borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 14, padding: 12, marginVertical: 12, backgroundColor: '#FAFCFA', minHeight: 90 },
  battleLogTitle: { fontSize: 11, fontWeight: '900', color: '#566159', marginBottom: 6 },
  battleLogText: { fontSize: 11, color: '#273229', lineHeight: 16, marginTop: 2 },
  battleActions: { gap: 8 },
  lockedAbilityNotice: { borderWidth: 1, borderColor: '#E2E7E3', borderRadius: 10, padding: 8, alignItems: 'center', backgroundColor: '#F8FAF8' },
  lockedAbilityNoticeText: { fontSize: 10, color: '#7B857F', fontWeight: '700' },
  battleOutcomeBox: { borderWidth: 1, borderColor: '#CBECD6', backgroundColor: '#F4FFF7', borderRadius: 16, padding: 16, alignItems: 'center' },
  battleOutcomeTitle: { fontSize: 18, fontWeight: '900', color: '#087B35' },
  battleOutcomeCopy: { fontSize: 12, color: '#566159', textAlign: 'center', marginVertical: 8 },
  buttonDisabled: { opacity: 0.5 },

  // Battle Stats Tab
  battleStatsContainer: { gap: 10 },
  battleStatHeader: { borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 16, padding: 14, backgroundColor: '#FFFFFF' },
  battleStatHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#1B211C' },
  abilitySlotLocked: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E1E8E3', borderRadius: 12, padding: 10, backgroundColor: '#F8FAF8', marginBottom: 6 },
  abilitySlotIcon: { fontSize: 16 },
  abilitySlotName: { fontSize: 12, fontWeight: '800', color: '#566159' },
  abilitySlotHint: { fontSize: 10, color: '#879089', marginTop: 2 },

  // Auth Styling
  authTabRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  authTab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#F8FAF8' },
  authTabActive: { backgroundColor: '#0BA84A' },
  authTabText: { fontSize: 13, fontWeight: '700', color: '#68716C' },
  authTabTextActive: { color: '#FFFFFF', fontWeight: '900' },
  authError: { color: '#D9383A', backgroundColor: '#FCE8E8', borderRadius: 10, padding: 10, fontSize: 12, fontWeight: '700', marginBottom: 12 },
  authForm: { gap: 10 },
  avatarPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
  avatarChoice: { width: '30%', borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 12, padding: 8, alignItems: 'center', backgroundColor: '#FFFFFF' },
  avatarChoiceActive: { borderColor: '#0BA84A', borderWidth: 2, backgroundColor: '#EDF5EF' },
  avatarChoiceEmoji: { fontSize: 24 },
  avatarChoiceName: { fontSize: 10, fontWeight: '800', color: '#566159', textTransform: 'capitalize', marginTop: 2 },

  // Profile Hero
  profileHero: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 18, padding: 14, marginBottom: 12, backgroundColor: '#FFFFFF' },
  profileHeroAvatar: { fontSize: 36, marginRight: 12 },
  profileHeroInfo: { flex: 1 },
  profileHeroName: { fontSize: 17, fontWeight: '900', color: '#1B211C' },
  profileHeroBand: { fontSize: 11, color: '#68716C', marginTop: 2 },
  editProfileBtn: { borderWidth: 1, borderColor: '#0BA84A', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  editProfileBtnText: { color: '#0BA84A', fontSize: 11, fontWeight: '800' },

  // Camera Styles
  cameraPage: { flex: 1, backgroundColor: '#182019', overflow: 'hidden' },
  cameraPermission: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: '#182019' },
  cameraTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center', lineHeight: 24 },
  cameraPreview: { flex: 1 },
  cameraOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 25, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)' },
  cameraBackButton: { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.52)', alignItems: 'center', justifyContent: 'center' },
  cameraBackText: { color: '#FFFFFF', fontSize: 28, lineHeight: 30, fontWeight: '700' },
  cameraBrand: { position: 'absolute', top: 26, color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  cameraHint: { position: 'absolute', top: 68, color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.62)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6, fontSize: 11, fontWeight: '700' },
  cameraPersonalRecord: { color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.62)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, fontSize: 10, textAlign: 'center', overflow: 'hidden', marginBottom: 16 },
  cameraActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 },
  samplePhotoButton: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  samplePhotoText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  shutter: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.82)', padding: 5, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: '100%', height: '100%', borderRadius: 30, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#D9E2DB' },

  // Bottom Nav
  bottomNav: { position: 'absolute', height: 68, bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E1E7E2', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  navItem: { width: 50, alignItems: 'center', justifyContent: 'center', minHeight: 46 },
  navIcon: { color: '#879089', fontSize: 17 },
  navLabel: { color: '#879089', fontSize: 9, marginTop: 2 },
  navActive: { color: '#0BA84A', fontWeight: '900' },
  navDisabled: { color: '#B9C1BC' },
  recordButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#0BA84A', alignItems: 'center', justifyContent: 'center', marginTop: -24, shadowColor: '#0BA84A', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  cameraNavIcon: { width: 24, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  cameraNavLens: { width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#FFFFFF' },
  fullWidth: { alignSelf: 'stretch' },
  quizOption: { minHeight: 52, paddingHorizontal: 14, paddingVertical: 10 },
  quizOptionSelected: { backgroundColor: '#0BA84A', borderColor: '#0BA84A' },
  quizOptionText: { textAlign: 'center', lineHeight: 18 },
  quizOptionTextSelected: { color: '#FFFFFF' },
  pressed: { opacity: 0.72 },
  galleryEmpty: { borderWidth: 1, borderColor: '#CBECD6', backgroundColor: '#F4FFF7', borderRadius: 14, padding: 18, alignItems: 'center' },
  galleryEmptyTitle: { color: '#087B35', fontSize: 15, fontWeight: '800', marginBottom: 5 },
  searchBox: { minHeight: 46, marginBottom: 12, borderWidth: 1, borderColor: '#C8D1CA', borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF' },
  searchIcon: { color: '#879089', fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, color: '#1B211C', fontSize: 13, minHeight: 44, paddingVertical: 0 },
  searchClear: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EDF5EF', alignItems: 'center', justifyContent: 'center' },
  searchClearText: { color: '#087B35', fontSize: 20, lineHeight: 22, fontWeight: '700' },
  searchEmpty: { borderWidth: 1, borderColor: '#CBECD6', backgroundColor: '#F4FFF7', borderRadius: 14, padding: 18, alignItems: 'center' },
  searchEmptyTitle: { color: '#087B35', fontSize: 15, fontWeight: '800', marginBottom: 4 },
});
