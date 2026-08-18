import { useEffect, useMemo, useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Screen = 'home' | 'photo' | 'category' | 'species' | 'confirm' | 'success' | 'collection' | 'about' | 'facts' | 'gallery' | 'quiz' | 'locked' | 'progress';
type Species = { id: string; common_name: string; scientific_name: string; category: string; habitat: string; diet: string; fun_fact: string; act716_status?: string | null };
type QuizQuestion = { question: string; options: string[]; correct_index: number; explanation?: string };
type RecentCapture = Species & { location_label?: string | null; recorded_at?: string | null };

const IMAGES = {
  Mammal: require('../../assets/wildlife/mammals.jpg'),
  Bird: require('../../assets/wildlife/birds.jpg'),
  Butterfly: require('../../assets/wildlife/butterflies.jpg'),
  Reptile: require('../../assets/wildlife/reptiles.jpg'),
  marmoset: require('../../assets/wildlife/marmoset.jpg'),
  tapir: require('../../assets/wildlife/malayan-tapir-card.jpg'),
  recent: require('../../assets/wildlife/recent-marmoset.jpg'),
};

// Iteration 1 is intentionally a limited, image-backed catalogue. Do not show
// a species as selectable until we have a real local reference photo for it.
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
  { id: 'sp_common_mormon', common_name: 'Common Mormon', scientific_name: 'Papilio polytes', category: 'Butterfly', habitat: 'Gardens, parks and forest edges across Malaysia.', diet: 'Flower nectar and citrus leaves.', fun_fact: 'Some females copy the look of a poisonous butterfly.' },
  { id: 'sp_malayan_tapir', common_name: 'Malayan Tapir', scientific_name: 'Tapirus indicus', category: 'Mammal', habitat: 'Rainforest, often near water.', diet: 'Leaves, shoots and fruit.', fun_fact: 'Tapir babies are born with stripes and spots.' },
  { id: 'sp_oriental_pied_hornbill', common_name: 'Oriental Pied Hornbill', scientific_name: 'Anthracoceros albirostris', category: 'Bird', habitat: 'Lowland forests, forest edges and gardens.', diet: 'Fruit, insects and small animals.', fun_fact: 'Its wingbeats can make a loud whooshing sound.' },
  { id: 'sp_asian_elephant', common_name: 'Asian Elephant', scientific_name: 'Elephas maximus', category: 'Mammal', habitat: 'Forests and forest edges in Malaysia.', diet: 'Grass, leaves, bark and fruit.', fun_fact: 'Its trunk helps it smell, drink and pick up food.' },
  { id: 'sp_green_sea_turtle', common_name: 'Green Sea Turtle', scientific_name: 'Chelonia mydas', category: 'Reptile', habitat: 'Tropical seas, seagrass beds and nesting beaches.', diet: 'Seagrass and algae.', fun_fact: 'They return to beaches near where they hatched.' },
  { id: 'sp_malayan_pangolin', common_name: 'Malayan Pangolin', scientific_name: 'Manis javanica', category: 'Mammal', habitat: 'Forests and plantations with plenty of cover.', diet: 'Ants and termites.', fun_fact: 'Its scales are made from keratin, like our fingernails.' },
  { id: 'sp_malayan_tiger', common_name: 'Malayan Tiger', scientific_name: 'Panthera tigris jacksoni', category: 'Mammal', habitat: 'Dense tropical forests in Peninsular Malaysia.', diet: 'Deer and other wild animals.', fun_fact: 'Every tiger has a unique stripe pattern.' },
  { id: 'sp_mouse_deer', common_name: 'Lesser Mouse-deer', scientific_name: 'Tragulus kanchil', category: 'Mammal', habitat: 'Forest undergrowth and river edges.', diet: 'Leaves, fruit and fungi.', fun_fact: 'It is one of the world’s smallest hoofed mammals.' },
  { id: 'sp_proboscis_monkey', common_name: 'Proboscis Monkey', scientific_name: 'Nasalis larvatus', category: 'Mammal', habitat: 'Mangroves and riverine forests in Borneo.', diet: 'Leaves, seeds and unripe fruit.', fun_fact: 'Adult males have famously long noses.' },
  { id: 'sp_reticulated_python', common_name: 'Reticulated Python', scientific_name: 'Malayopython reticulatus', category: 'Reptile', habitat: 'Forests, wetlands and waterways.', diet: 'Small animals.', fun_fact: 'It has a beautiful net-like pattern on its skin.' },
  { id: 'sp_rhinoceros_hornbill', common_name: 'Rhinoceros Hornbill', scientific_name: 'Buceros rhinoceros', category: 'Bird', habitat: 'Large, mature rainforests.', diet: 'Fruit, insects and small animals.', fun_fact: 'It is the state bird of Sarawak.' },
  { id: 'sp_saltwater_crocodile', common_name: 'Saltwater Crocodile', scientific_name: 'Crocodylus porosus', category: 'Reptile', habitat: 'Rivers, mangroves and estuaries.', diet: 'Fish and other animals.', fun_fact: 'It is the world’s largest living reptile.' },
  { id: 'sp_sunda_colugo', common_name: 'Sunda Colugo', scientific_name: 'Galeopterus variegatus', category: 'Mammal', habitat: 'Forest canopy and tall trees.', diet: 'Leaves, shoots and fruit.', fun_fact: 'It glides between trees using a wide skin membrane.' },
  { id: 'sp_sun_bear', common_name: 'Sun Bear', scientific_name: 'Helarctos malayanus', category: 'Mammal', habitat: 'Lowland tropical rainforest.', diet: 'Fruit, insects and honey.', fun_fact: 'It is the smallest bear species in the world.' },
  { id: 'sp_tailed_jay', common_name: 'Tailed Jay', scientific_name: 'Graphium agamemnon', category: 'Butterfly', habitat: 'Gardens and forest edges.', diet: 'Flower nectar.', fun_fact: 'It is a very fast-flying butterfly.' },
  {"id":"sp_ashy_tailorbird","common_name":"Ashy Tailorbird","scientific_name":"Orthotomus ruficeps","category":"Bird","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_asian_blue_quail","common_name":"Asian Blue Quail","scientific_name":"Synoicus chinensis","category":"Bird","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_asian_small_clawed_otter","common_name":"Asian Small-clawed Otter","scientific_name":"Aonyx cinereus","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_asiatic_brush_tailed_porcupine","common_name":"Asiatic Brush-tailed Porcupine","scientific_name":"Atherurus macrourus","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_asiatic_golden_cat","common_name":"Asiatic Golden Cat","scientific_name":"Catopuma temminckii","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_asiatic_striped_squirrels","common_name":"Asiatic Striped Squirrels","scientific_name":"Tamiops rodolphii","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_banded_civet","common_name":"Banded Civet","scientific_name":"Hemigalus derbyanus","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_banded_leaf_monkey","common_name":"Banded Leaf Monkey","scientific_name":"Presbytis femoralis","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_banded_linsang","common_name":"Banded Linsang","scientific_name":"Prionodon linsang","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_banteng","common_name":"Banteng","scientific_name":"Bos javanicus","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_barred_eagle_owl","common_name":"Barred Eagle-owl","scientific_name":"Bubo sumatranus","category":"Bird","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_bearded_pig","common_name":"Bearded Pig","scientific_name":"Sus barbatus","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_binturong","common_name":"Binturong","scientific_name":"Arctictis binturong","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_black_crowned_pitta","common_name":"Black-crowned Pitta","scientific_name":"Erythropitta ussheri","category":"Bird","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_black_crowned_pitta_2","common_name":"Black-crowned Pitta","scientific_name":"Pittasoma michleri","category":"Bird","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_black_giant_squirrel","common_name":"Black Giant Squirrel","scientific_name":"Ratufa bicolor","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife.","act716_status":"Totally Protected"},

  {"id":"sp_black_rumped_flameback","common_name":"Black-rumped Flameback","scientific_name":"Dinopium benghalense","category":"Bird","habitat":"Forests, plantations and gardens.","diet":"Insects, especially ants and beetles.","fun_fact":"It has a brilliant golden back."},
  {"id":"sp_changeable_hawk_eagle","common_name":"Changeable Hawk-eagle","scientific_name":"Nisaetus cirrhatus","category":"Bird","habitat":"Forests and forest edges.","diet":"Birds, mammals and reptiles.","fun_fact":"Its plumage changes colour as it ages."},
  {"id":"sp_chestnut_capped_babbler","common_name":"Chestnut-capped Babbler","scientific_name":"Timalia pileata","category":"Bird","habitat":"Grasslands and scrub.","diet":"Insects and seeds.","fun_fact":"It has a rich chestnut cap."},
  {"id":"sp_chestnut_capped_thrush","common_name":"Chestnut-capped Thrush","scientific_name":"Geokichla interpres","category":"Bird","habitat":"Lowland rainforests.","diet":"Insects, worms and fruit.","fun_fact":"It has a striking chestnut cap."},
  {"id":"sp_cinereous_bulbul","common_name":"Cinereous Bulbul","scientific_name":"Hemixos cinereus","category":"Bird","habitat":"Montane forests.","diet":"Fruit, nectar and insects.","fun_fact":"It has a greyish, cinereous plumage."},
  {"id":"sp_clouded_leopard","common_name":"Clouded Leopard","scientific_name":"Neofelis nebulosa","category":"Mammal","habitat":"Dense tropical forests across Southeast Asia.","diet":"Deer, monkeys and wild pigs.","fun_fact":"Its cloud-like spots help it blend into the forest canopy."},
  {"id":"sp_collared_mongoose","common_name":"Collared Mongoose","scientific_name":"Herpestes semitorquatus","category":"Mammal","habitat":"Lowland forests near water.","diet":"Small animals, insects and crustaceans.","fun_fact":"It has a distinctive white collar."},
  {"id":"sp_common_emerald_dove","common_name":"Common Emerald Dove","scientific_name":"Chalcophaps indica","category":"Bird","habitat":"Forests, mangroves and gardens.","diet":"Seeds and fallen fruit.","fun_fact":"Its wings make a distinctive whistling sound in flight."},
  {"id":"sp_common_hill_myna","common_name":"Common Hill Myna","scientific_name":"Gracula religiosa","category":"Bird","habitat":"Lowland and hill forests.","diet":"Fruit, nectar and insects.","fun_fact":"It is famous for its ability to mimic human speech."},
  {"id":"sp_common_palm_civet","common_name":"Common Palm Civet","scientific_name":"Paradoxurus hermaphroditus","category":"Mammal","habitat":"Forests, gardens and urban areas.","diet":"Fruit, small animals and insects.","fun_fact":"It is famous for producing civet coffee."},
  {"id":"sp_common_sun_skink","common_name":"Common Sun Skink","scientific_name":"Eutropis multifasciata","category":"Reptile","habitat":"Forests, gardens and urban areas.","diet":"Insects and small invertebrates.","fun_fact":"It is one of the most common lizards in Malaysia."},
  {"id":"sp_common_treeshrew","common_name":"Common Treeshrew","scientific_name":"Tupaia glis","category":"Mammal","habitat":"Forests and plantations.","diet":"Insects and fruit.","fun_fact":"It looks like a squirrel but is more closely related to primates."},
  {"id":"sp_common_water_monitor","common_name":"Common Water Monitor","scientific_name":"Varanus salvator","category":"Reptile","habitat":"Rivers, lakes and mangroves.","diet":"Fish, birds, eggs and carrion.","fun_fact":"It is the second-largest lizard in the world."},
  {"id":"sp_crab_eating_macaque","common_name":"Crab-eating Macaque","scientific_name":"Macaca fascicularis","category":"Mammal","habitat":"Mangroves, forests and river edges.","diet":"Fruit, crabs and small animals.","fun_fact":"These macaques are known for washing food before eating."},
  {"id":"sp_crab_eating_mongoose","common_name":"Crab-eating Mongoose","scientific_name":"Herpestes urva","category":"Mammal","habitat":"Streams, rivers and wetlands.","diet":"Crabs, fish and amphibians.","fun_fact":"It is named for its diet of crabs."},
  {"id":"sp_crested_partridge","common_name":"Crested Partridge","scientific_name":"Rollulus rouloul","category":"Bird","habitat":"Lowland rainforest floor.","diet":"Seeds, fruit and insects.","fun_fact":"Males have a distinctive red crest."},
  {"id":"sp_crested_serpent_eagle","common_name":"Crested Serpent-eagle","scientific_name":"Spilornis cheela","category":"Bird","habitat":"Forests, plantations and open areas.","diet":"Snakes, lizards and small mammals.","fun_fact":"It is a specialist snake hunter."},
  {"id":"sp_crimson_headed_partridge","common_name":"Crimson-headed Partridge","scientific_name":"Haematortyx sanguiniceps","category":"Bird","habitat":"Montane forests of Borneo.","diet":"Seeds, fruit and insects.","fun_fact":"It has a bright crimson head."},
  {"id":"sp_crimson_winged_woodpecker","common_name":"Crimson-winged Woodpecker","scientific_name":"Picus puniceus","category":"Bird","habitat":"Lowland and hill forests.","diet":"Insects and larvae.","fun_fact":"Its crimson wings make it easy to spot."},
  {"id":"sp_dark_necked_tailorbird","common_name":"Dark-necked Tailorbird","scientific_name":"Orthotomus atrogularis","category":"Bird","habitat":"Forests and gardens.","diet":"Insects and spiders.","fun_fact":"It has a dark chestnut neck."},
  {"id":"sp_dhole","common_name":"Dhole","scientific_name":"Cuon alpinus","category":"Mammal","habitat":"Forests, scrub and grasslands.","diet":"Deer and other medium-sized mammals.","fun_fact":"Dholes hunt in packs and communicate with whistles."},
  {"id":"sp_dusky_leaf_monkey","common_name":"Dusky Leaf Monkey","scientific_name":"Trachypithecus obscurus","category":"Mammal","habitat":"Rainforest canopy and river edges.","diet":"Leaves, fruit and seeds.","fun_fact":"Babies are born bright orange for camouflage."},
  {"id":"sp_flat_headed_cat","common_name":"Flat-headed Cat","scientific_name":"Prionailurus planiceps","category":"Mammal","habitat":"Wetlands, rivers and swamp forests.","diet":"Fish, frogs and crustaceans.","fun_fact":"It has partially webbed feet for catching fish."},
  {"id":"sp_four_striped_ground_squirrel","common_name":"Four-striped Ground Squirrel","scientific_name":"Lariscus hosei","category":"Mammal","habitat":"Forest floor and undergrowth.","diet":"Fruit, seeds and insects.","fun_fact":"It has four distinctive stripes on its back."},
  {"id":"sp_gaur","common_name":"Gaur","scientific_name":"Bos gaurus","category":"Mammal","habitat":"Evergreen forests and grasslands.","diet":"Grass, leaves and bamboo shoots.","fun_fact":"The gaur is the largest species of wild cattle.","act716_status":"Totally Protected"},
  {"id":"sp_great_argus","common_name":"Great Argus","scientific_name":"Argusianus argus","category":"Bird","habitat":"Lowland rainforests.","diet":"Fruit, seeds and insects.","fun_fact":"Males have the longest tail feathers of any bird."},
  {"id":"sp_greater_coucal","common_name":"Greater Coucal","scientific_name":"Centropus sinensis","category":"Bird","habitat":"Forests, scrub and wetlands.","diet":"Insects, small animals and fruit.","fun_fact":"It is also called the Crow Pheasant."},
  {"id":"sp_greater_oriental_chevrotain","common_name":"Greater Oriental Chevrotain","scientific_name":"Tragulus napu","category":"Mammal","habitat":"Forests near water.","diet":"Leaves, fruit and fungi.","fun_fact":"It is also known as the Greater Mouse-deer."},
  {"id":"sp_green_backed_heron","common_name":"Green-backed Heron","scientific_name":"Butorides striata","category":"Bird","habitat":"Wetlands, rivers and mangroves.","diet":"Fish, frogs and insects.","fun_fact":"It uses bait to attract fish."},
  {"id":"sp_green_billed_coucal","common_name":"Green-billed Coucal","scientific_name":"Centropus chlororhynchos","category":"Bird","habitat":"Rainforests and dense thickets.","diet":"Insects, small animals and fruit.","fun_fact":"It is endemic to Sri Lanka's wet zone."},
  {"id":"sp_grey_bellied_squirrel","common_name":"Grey-bellied Squirrel","scientific_name":"Callosciurus caniceps","category":"Mammal","habitat":"Forests and plantations.","diet":"Fruit, nuts and seeds.","fun_fact":"Its grey belly distinguishes it from other squirrels."},
  {"id":"sp_honey_buzzard","common_name":"Honey Buzzard","scientific_name":"Pernis apivorus","category":"Bird","habitat":"Forests and open woodlands.","diet":"Wasp and bee larvae.","fun_fact":"It digs up wasp nests to eat the larvae."},
  {"id":"sp_hose_s_civet","common_name":"Hose's Civet","scientific_name":"Diplogale hosei","category":"Mammal","habitat":"Montane forests of Borneo.","diet":"Small animals, fruit and insects.","fun_fact":"One of the least known civet species."},
  {"id":"sp_hose_s_langur","common_name":"Hose's Langur","scientific_name":"Presbytis hosei","category":"Mammal","habitat":"Montane forests of Borneo.","diet":"Leaves and fruit.","fun_fact":"Named after zoologist Charles Hose."},
  {"id":"sp_indomalayan_bamboo_rat","common_name":"Indomalayan Bamboo Rat","scientific_name":"Rhizomys sumatrensis","category":"Mammal","habitat":"Bamboo forests and plantations.","diet":"Bamboo roots and shoots.","fun_fact":"It is one of the largest rat species."},
  {"id":"sp_lar_gibbon","common_name":"Lar Gibbon","scientific_name":"Hylobates lar","category":"Mammal","habitat":"Tall rainforest canopy.","diet":"Fruit, leaves and insects.","fun_fact":"Gibbons sing duets to strengthen family bonds."},
  {"id":"sp_large_indian_civet","common_name":"Large Indian Civet","scientific_name":"Viverra zibetha","category":"Mammal","habitat":"Forests, scrub and agricultural areas.","diet":"Small animals, birds and fruit.","fun_fact":"It has a distinctive black-and-white striped tail."},
  {"id":"sp_large_spotted_civet","common_name":"Large-spotted Civet","scientific_name":"Viverra megaspila","category":"Mammal","habitat":"Lowland forests.","diet":"Small mammals, birds and fruit.","fun_fact":"One of the largest civet species."},
  {"id":"sp_large_treeshrew","common_name":"Large Treeshrew","scientific_name":"Tupaia tana","category":"Mammal","habitat":"Lowland and hill forests.","diet":"Insects and fruit.","fun_fact":"It is the largest species of treeshrew."},
  {"id":"sp_leopard","common_name":"Leopard","scientific_name":"Panthera pardus","category":"Mammal","habitat":"Forests, mountains and grasslands.","diet":"Deer, monkeys and small mammals.","fun_fact":"Leopards are strong swimmers and excellent climbers.","act716_status":"Totally Protected"},
  {"id":"sp_lesser_dog_faced_fruit_bat","common_name":"Lesser Dog-faced Fruit Bat","scientific_name":"Cynopterus brachyotis","category":"Mammal","habitat":"Forests and urban gardens.","diet":"Fruit, nectar and pollen.","fun_fact":"It has a dog-like face."},
  {"id":"sp_long_tailed_porcupine","common_name":"Long-tailed Porcupine","scientific_name":"Trichys fasciculata","category":"Mammal","habitat":"Lowland forests.","diet":"Fruit, roots and bark.","fun_fact":"It has an unusually long tail for a porcupine."},
  {"id":"sp_long_tailed_sibia","common_name":"Long-tailed Sibia","scientific_name":"Heterophasia picaoides","category":"Bird","habitat":"Montane forests.","diet":"Insects, fruit and nectar.","fun_fact":"It has a very long, graduated tail."},
  {"id":"sp_mainland_leopard_cat","common_name":"Mainland Leopard Cat","scientific_name":"Prionailurus bengalensis","category":"Mammal","habitat":"Forests, grasslands and wetlands.","diet":"Small mammals, birds and reptiles.","fun_fact":"It is the most widespread wild cat in Asia.","act716_status":"Totally Protected"},
  {"id":"sp_malay_banded_pitta","common_name":"Malay Banded Pitta","scientific_name":"Hydrornis irena","category":"Bird","habitat":"Lowland rainforests.","diet":"Insects, worms and snails.","fun_fact":"It is also known as the Graceful Pitta."},
  {"id":"sp_malay_civet","common_name":"Malay Civet","scientific_name":"Viverra tangalunga","category":"Mammal","habitat":"Forests and plantations.","diet":"Fruit, small mammals and insects.","fun_fact":"Also known as the Oriental Civet."},
  {"id":"sp_malay_crested_fireback","common_name":"Malay Crested Fireback","scientific_name":"Lophura rufa","category":"Bird","habitat":"Lowland rainforests.","diet":"Fruit, seeds and insects.","fun_fact":"Males have a brilliant blue-black plumage."},
  {"id":"sp_malay_ground_cuckoo","common_name":"Malay Ground-cuckoo","scientific_name":"Carpococcyx radiceus","category":"Bird","habitat":"Lowland rainforest floor.","diet":"Insects, snails and fruit.","fun_fact":"It is a secretive, ground-dwelling bird."},
  {"id":"sp_malay_weasel","common_name":"Malay Weasel","scientific_name":"Mustela nudipes","category":"Mammal","habitat":"Lowland and hill forests.","diet":"Small mammals and birds.","fun_fact":"It is one of the least studied weasel species."},
  {"id":"sp_malayan_night_heron","common_name":"Malayan Night-Heron","scientific_name":"Gorsachius melanolophus","category":"Bird","habitat":"Forests near water.","diet":"Fish, frogs and crustaceans.","fun_fact":"It is most active at dusk and night."},
  {"id":"sp_malayan_peacock_pheasant","common_name":"Malayan Peacock-Pheasant","scientific_name":"Polyplectron malacense","category":"Bird","habitat":"Lowland rainforests.","diet":"Seeds, fruit and insects.","fun_fact":"Its tail feathers have eye-like spots."},
  {"id":"sp_malayan_porcupine","common_name":"Malayan Porcupine","scientific_name":"Hystrix brachyura","category":"Mammal","habitat":"Forests, plantations and caves.","diet":"Roots, fruit and bark.","fun_fact":"Its quills can be up to 30 cm long.","act716_status":"Protected"},
  {"id":"sp_malaysian_field_rat","common_name":"Malaysian Field Rat","scientific_name":"Rattus tiomanicus","category":"Mammal","habitat":"Agricultural areas and grasslands.","diet":"Grains, fruit and insects.","fun_fact":"It is common in oil palm plantations."},
  {"id":"sp_malaysian_rail_babbler","common_name":"Malaysian Rail-babbler","scientific_name":"Eupetes macrocerus","category":"Bird","habitat":"Lowland rainforest floor.","diet":"Insects and small invertebrates.","fun_fact":"It is more closely related to rails than babblers."},
  {"id":"sp_marbled_cat","common_name":"Marbled Cat","scientific_name":"Pardofelis marmorata","category":"Mammal","habitat":"Rainforest canopy.","diet":"Squirrels, birds and lizards.","fun_fact":"Its long tail helps it balance in trees."},
  {"id":"sp_maroon_sureli","common_name":"Maroon Sureli","scientific_name":"Presbytis rubicunda","category":"Mammal","habitat":"Bornean rainforest canopy.","diet":"Leaves, fruit and seeds.","fun_fact":"This monkey has a rich maroon coat."},
  {"id":"sp_masked_palm_civet","common_name":"Masked Palm Civet","scientific_name":"Paguma larvata","category":"Mammal","habitat":"Forests, plantations and gardens.","diet":"Fruit, small animals and insects.","fun_fact":"Also known as the Gem-faced Civet."},
  {"id":"sp_moonrat","common_name":"Moonrat","scientific_name":"Echinosorex gymnura","category":"Mammal","habitat":"Lowland forests near streams.","diet":"Insects, worms and small animals.","fun_fact":"Despite its name, it is related to hedgehogs."},
  {"id":"sp_mountain_imperial_pigeon","common_name":"Mountain Imperial-pigeon","scientific_name":"Ducula badia","category":"Bird","habitat":"Montane and hill forests.","diet":"Fruit and berries.","fun_fact":"It is one of the largest pigeon species."},
  {"id":"sp_noisy_rat","common_name":"Noisy Rat","scientific_name":"Leopoldamys sabanus","category":"Mammal","habitat":"Lowland and hill forests.","diet":"Fruit, seeds and insects.","fun_fact":"It is named for its loud vocalisations."},
  {"id":"sp_northern_treeshrew","common_name":"Northern Treeshrew","scientific_name":"Tupaia belangeri","category":"Mammal","habitat":"Forests across Southeast Asia.","diet":"Insects and fruit.","fun_fact":"Treeshrews have a very high brain-to-body ratio."},
  {"id":"sp_orange_headed_thrush","common_name":"Orange-headed Thrush","scientific_name":"Geokichla citrina","category":"Bird","habitat":"Lowland and hill forests.","diet":"Insects, worms and fruit.","fun_fact":"It has an orange head and breast."},
  {"id":"sp_oriental_magpie_robin","common_name":"Oriental Magpie-robin","scientific_name":"Copsychus saularis","category":"Bird","habitat":"Forests, gardens and urban areas.","diet":"Insects, worms and fruit.","fun_fact":"It is the national bird of Bangladesh."},
  {"id":"sp_otter_civet","common_name":"Otter civet","scientific_name":"Cynogale bennettii","category":"Mammal","habitat":"Lowland forests near water.","diet":"Fish, crabs and amphibians.","fun_fact":"It is adapted for a semi-aquatic lifestyle."},
  {"id":"sp_pale_giant_squirrel","common_name":"Pale Giant Squirrel","scientific_name":"Ratufa affinis","category":"Mammal","habitat":"Forest canopy in Borneo.","diet":"Fruit, nuts and seeds.","fun_fact":"It is also known as the Cream-coloured Giant Squirrel.","act716_status":"Totally Protected"},
  {"id":"sp_plantain_squirrel","common_name":"Plantain Squirrel","scientific_name":"Callosciurus notatus","category":"Mammal","habitat":"Forests, gardens and urban parks.","diet":"Fruit, nuts and flowers.","fun_fact":"It is one of the most common squirrels in Malaysia."},
  {"id":"sp_prevost_s_squirrel","common_name":"Prevost's Squirrel","scientific_name":"Callosciurus prevostii","category":"Mammal","habitat":"Rainforest canopy.","diet":"Fruit, nuts and insects.","fun_fact":"It has a striking tri-colour pattern.","act716_status":"Totally Protected"},
  {"id":"sp_red_junglefowl","common_name":"Red Junglefowl","scientific_name":"Gallus gallus","category":"Bird","habitat":"Forest edges and bamboo thickets.","diet":"Seeds, fruit and insects.","fun_fact":"It is the wild ancestor of domestic chickens."},
  {"id":"sp_roughneck_monitor","common_name":"Roughneck Monitor","scientific_name":"Varanus rudicollis","category":"Reptile","habitat":"Lowland rainforests.","diet":"Insects, small mammals and eggs.","fun_fact":"It has rough, keeled scales on its neck."},
  {"id":"sp_rufous_browed_babbler","common_name":"Rufous-browed Babbler","scientific_name":"Pellorneum capistratum","category":"Bird","habitat":"Lowland rainforest floor.","diet":"Insects and small invertebrates.","fun_fact":"It has a distinctive rufous brow."},
  {"id":"sp_rufous_tailed_pheasant","common_name":"Rufous-tailed Pheasant","scientific_name":"Lophura erythrophthalma","category":"Bird","habitat":"Lowland rainforests.","diet":"Fruit, seeds and insects.","fun_fact":"Also known as the Crestless Fireback."},
  {"id":"sp_rufous_tailed_shama","common_name":"Rufous-tailed shama","scientific_name":"Copsychus pyrropygus","category":"Bird","habitat":"Lowland rainforests.","diet":"Insects, worms and fruit.","fun_fact":"It has a long rufous tail."},
  {"id":"sp_sambar","common_name":"Sambar","scientific_name":"Rusa unicolor","category":"Mammal","habitat":"Forests near water sources.","diet":"Leaves, grass and aquatic plants.","fun_fact":"Sambar are the largest deer species in Southeast Asia.","act716_status":"Protected"},
  {"id":"sp_serow","common_name":"Serow","scientific_name":"Capricornis sumatraensis","category":"Mammal","habitat":"Rocky hillsides and montane forests.","diet":"Grass, leaves and bamboo shoots.","fun_fact":"Serows are goat-like mammals that live near cliffs.","act716_status":"Totally Protected"},
  {"id":"sp_short_tailed_babbler","common_name":"Short-tailed Babbler","scientific_name":"Pellorneum malaccense","category":"Bird","habitat":"Lowland rainforest floor.","diet":"Insects and small invertebrates.","fun_fact":"It has a very short tail."},
  {"id":"sp_short_tailed_mongoose","common_name":"Short-tailed Mongoose","scientific_name":"Herpestes brachyurus","category":"Mammal","habitat":"Forests, scrub and plantations.","diet":"Small mammals, birds and insects.","fun_fact":"It is a skilled hunter of small prey."},
  {"id":"sp_short_tailed_mongoose_2","common_name":"Short-tailed mongoose","scientific_name":"Urva brachyura","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"Leaves, fruit, insects and small animals.","fun_fact":"This species is part of Malaysia's diverse wildlife."},
  {"id":"sp_small_indian_mongoose","common_name":"Small Indian Mongoose","scientific_name":"Herpestes auropunctatus","category":"Mammal","habitat":"Forests, scrub and urban areas.","diet":"Insects, small animals and fruit.","fun_fact":"It was introduced to many islands for pest control."},
  {"id":"sp_small_toothed_palm_civet","common_name":"Small-toothed Palm Civet","scientific_name":"Arctogalidia trivirgata","category":"Mammal","habitat":"Rainforest canopy.","diet":"Fruit, nectar and small animals.","fun_fact":"It has a prehensile tail for climbing."},
  {"id":"sp_smooth_coated_otter","common_name":"Smooth-coated Otter","scientific_name":"Lutrogale perspicillata","category":"Mammal","habitat":"Rivers, lakes and mangroves.","diet":"Fish, crabs and amphibians.","fun_fact":"It has a shorter, smoother coat than other otters."},
  {"id":"sp_sooty_capped_babbler","common_name":"Sooty-capped Babbler","scientific_name":"Malacopteron affine","category":"Bird","habitat":"Lowland rainforests.","diet":"Insects and small invertebrates.","fun_fact":"It has a sooty-coloured cap."},
  {"id":"sp_southern_pig_tailed_macaque","common_name":"Southern Pig-tailed Macaque","scientific_name":"Macaca nemestrina","category":"Mammal","habitat":"Lowland and hill forests.","diet":"Fruit, seeds and small animals.","fun_fact":"They have a short, pig-like tail."},
  {"id":"sp_southern_red_muntjac","common_name":"Southern Red Muntjac","scientific_name":"Muntiacus muntjak","category":"Mammal","habitat":"Forests across Southeast Asia.","diet":"Leaves, fruit and grass.","fun_fact":"It is also called the Indian Muntjac."},
  {"id":"sp_spotted_giant_flying_squirrel","common_name":"Spotted Giant Flying Squirrel","scientific_name":"Petaurista elegans","category":"Mammal","habitat":"Tall rainforest canopy.","diet":"Leaves, fruit and nuts.","fun_fact":"It can glide up to 100 metres between trees."},
  {"id":"sp_striped_wren_babbler","common_name":"Striped Wren-babbler","scientific_name":"Kenopia striata","category":"Bird","habitat":"Lowland rainforest floor.","diet":"Insects and small invertebrates.","fun_fact":"Its striped pattern helps it hide in leaf litter."},
  {"id":"sp_stump_tailed_macaque","common_name":"Stump-tailed Macaque","scientific_name":"Macaca arctoides","category":"Mammal","habitat":"Hill and montane forests.","diet":"Fruit, leaves and insects.","fun_fact":"Their faces turn bright red when excited."},
  {"id":"sp_sunda_clouded_leopard","common_name":"Sunda Clouded Leopard","scientific_name":"Neofelis diardi","category":"Mammal","habitat":"Bornean and Sumatran rainforests.","diet":"Deer, monkeys and wild pigs.","fun_fact":"It has the longest canine teeth of any cat."},
  {"id":"sp_sunda_laughingthrush","common_name":"Sunda Laughingthrush","scientific_name":"Garrulax palliatus","category":"Bird","habitat":"Montane forests.","diet":"Insects, fruit and seeds.","fun_fact":"It has a loud, laughing call."},
  {"id":"sp_sunda_pied_fantail","common_name":"Sunda Pied Fantail","scientific_name":"Rhipidura javanica","category":"Bird","habitat":"Forests, mangroves and gardens.","diet":"Insects caught in flight.","fun_fact":"It fans its tail while foraging."},
  {"id":"sp_sunda_stink_badger","common_name":"Sunda Stink-badger","scientific_name":"Mydaus javanensis","category":"Mammal","habitat":"Forests and plantations.","diet":"Insects, worms and small animals.","fun_fact":"It sprays a foul-smelling liquid when threatened."},
  {"id":"sp_thick_spined_porcupine","common_name":"Thick-spined Porcupine","scientific_name":"Hystrix crassispinis","category":"Mammal","habitat":"Forests and rocky areas.","diet":"Roots, fruit and bark.","fun_fact":"It has the thickest spines of any porcupine."},
  {"id":"sp_three_striped_ground_squirrel","common_name":"Three-striped Ground Squirrel","scientific_name":"Lariscus insignis","category":"Mammal","habitat":"Forest floor, often near streams.","diet":"Fruit, seeds and insects.","fun_fact":"It is named for its three back stripes."},
  {"id":"sp_tiger_shrike","common_name":"Tiger Shrike","scientific_name":"Lanius tigrinus","category":"Bird","habitat":"Forest edges, scrub and gardens.","diet":"Insects, lizards and small birds.","fun_fact":"It impales prey on thorns for storage."},
  {"id":"sp_tufted_ground_squirrel","common_name":"Tufted Ground Squirrel","scientific_name":"Rheithrosciurus macrotis","category":"Mammal","habitat":"Bornean rainforests.","diet":"Fruit, nuts and seeds.","fun_fact":"It has a large, bushy tail."},
  {"id":"sp_vieillot_s_fireback","common_name":"Vieillot's Fireback","scientific_name":"Lophura ignita","category":"Bird","habitat":"Lowland rainforests.","diet":"Fruit, seeds and insects.","fun_fact":"Named after the French ornithologist Louis Vieillot."},
  {"id":"sp_western_hooded_pitta","common_name":"Western Hooded Pitta","scientific_name":"Pitta sordida","category":"Bird","habitat":"Forests, plantations and gardens.","diet":"Insects, worms and snails.","fun_fact":"It is known for its colourful plumage."},
  {"id":"sp_white_breasted_waterhen","common_name":"White-breasted Waterhen","scientific_name":"Amaurornis phoenicurus","category":"Bird","habitat":"Wetlands, marshes and ponds.","diet":"Insects, seeds and aquatic plants.","fun_fact":"It is often seen walking on floating vegetation."},
  {"id":"sp_white_crested_hornbill","common_name":"White-crested hornbill","scientific_name":"Tropicranus albocristatus","category":"Bird","habitat":"Lowland rainforests of Africa.","diet":"Fruit, insects and small animals.","fun_fact":"It has a white crest on its head."},
  {"id":"sp_white_crowned_forktail","common_name":"White-crowned Forktail","scientific_name":"Enicurus leschenaulti","category":"Bird","habitat":"Fast-flowing forest streams.","diet":"Insects and small invertebrates.","fun_fact":"It bobs its tail constantly while foraging."},
  {"id":"sp_white_fronted_langur","common_name":"White-fronted Langur","scientific_name":"Presbytis frontata","category":"Mammal","habitat":"Lowland rainforests in Borneo.","diet":"Leaves, fruit and seeds.","fun_fact":"Also known as the White-fronted Surili."},
  {"id":"sp_white_rumped_shama","common_name":"White-rumped Shama","scientific_name":"Copsychus malabaricus","category":"Bird","habitat":"Forests, plantations and gardens.","diet":"Insects, worms and fruit.","fun_fact":"It is known for its beautiful song."},
  {"id":"sp_white_tailed_wattled_pheasant","common_name":"White-tailed Wattled Pheasant","scientific_name":"Lophura bulweri","category":"Bird","habitat":"Bornean rainforests.","diet":"Fruit, seeds and insects.","fun_fact":"Males have bright blue facial wattles."},
  {"id":"sp_white_thighed_surili","common_name":"White-thighed Surili","scientific_name":"Presbytis siamensis","category":"Mammal","habitat":"Rainforests in Sumatra and Malaysia.","diet":"Leaves, fruit and flowers.","fun_fact":"This monkey has distinctive white thighs."},
  {"id":"sp_wild_boar","common_name":"Wild Boar","scientific_name":"Sus scrofa","category":"Mammal","habitat":"Forests, grasslands and wetlands.","diet":"Roots, fruit, insects and small animals.","fun_fact":"Wild boar are the ancestors of domestic pigs."},
  {"id":"sp_yellow_bellied_bulbul","common_name":"Yellow-bellied Bulbul","scientific_name":"Alophoixus phaeocephalus","category":"Bird","habitat":"Lowland and hill forests.","diet":"Fruit, nectar and insects.","fun_fact":"It has a bright yellow belly."},
  {"id":"sp_yellow_handed_mitered_langur","common_name":"Yellow-handed Mitered Langur","scientific_name":"Presbytis melalophos","category":"Mammal","habitat":"Lowland and hill rainforests.","diet":"Young leaves, fruit and seeds.","fun_fact":"Its hands have a distinctive yellow colour."},
  {"id":"sp_yellow_rumped_flycatcher","common_name":"Yellow-rumped Flycatcher","scientific_name":"Ficedula zanthopygia","category":"Bird","habitat":"Forests and woodlands.","diet":"Insects caught in flight.","fun_fact":"Males have a bright yellow rump."},
  {"id":"sp_yellow_throated_marten","common_name":"Yellow-throated Marten","scientific_name":"Martes flavigula","category":"Mammal","habitat":"Forests across Asia.","diet":"Small mammals, birds and fruit.","fun_fact":"It has a striking yellow-orange throat."},
  {"id":"sp_blue_breasted_quail","common_name":"Blue-breasted Quail","scientific_name":"Coturnix chinensis","category":"Bird","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_blue_headed_pitta","common_name":"Blue-headed Pitta","scientific_name":"Hydrornis baudii","category":"Bird","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  
  {"id":"sp_blyth_s_hawk_eagle","common_name":"Blyth's Hawk-Eagle","scientific_name":"Nisaetus alboniger","category":"Bird","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_bornean_banded_pitta","common_name":"Bornean Banded Pitta","scientific_name":"Hydrornis schwaneri","category":"Bird","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_bornean_orangutan","common_name":"Bornean Orangutan","scientific_name":"Pongo pygmaeus","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_bornean_partridge","common_name":"Bornean Partridge","scientific_name":"Arborophila hyperythra","category":"Bird","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_bornean_yellow_muntjac","common_name":"Bornean Yellow Muntjac","scientific_name":"Muntiacus atherodes","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_borneo_bay_cat","common_name":"Borneo Bay Cat","scientific_name":"Catopuma badia","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_borneo_earless_monitor","common_name":"Borneo Earless Monitor","scientific_name":"Lanthanotus borneensis","category":"Reptile","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_brown_rat","common_name":"Brown Rat","scientific_name":"Rattus norvegicus","category":"Mammal","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_buffy_fish_owl","common_name":"Buffy Fish-owl","scientific_name":"Ketupa ketupu","category":"Bird","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife.","act716_status":"Totally Protected"},
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
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [progress, setProgress] = useState({ found: 0, total: 20, xp: 0, categories: [] as { category: string; total: number; discovered: number }[] });
  const [history, setHistory] = useState<Screen[]>([]);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizQuestion, setQuizQuestion] = useState<QuizQuestion | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Record<string, string[]>>({});
  const [recentCaptures, setRecentCaptures] = useState<RecentCapture[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const refresh = async () => {
    try {
      const [speciesResponse, collectionResponse, progressResponse, recentResponse] = await Promise.all([
        fetch(`${apiBase}/api/v1/species`),
        fetch(`${apiBase}/api/v1/children/1/collection`),
        fetch(`${apiBase}/api/v1/children/1/progress`),
        fetch(`${apiBase}/api/v1/children/1/recent-captures`),
      ]);
      if (speciesResponse.ok) setSpecies(await speciesResponse.json());
      if (collectionResponse.ok) {
        const data = await collectionResponse.json();
        setDiscovered(data.items.filter((item: { discovered: number }) => item.discovered).map((item: { id: string }) => item.id));
      }
      if (progressResponse.ok) {
        const data = await progressResponse.json();
        setProgress({ found: data.found, total: data.total, xp: data.profile.xp, categories: data.categories });
      }
      if (recentResponse.ok) {
        const data = await recentResponse.json();
        setRecentCaptures(data.items);
      }
    } catch {
      setNotice('You are exploring in offline demo mode. Discoveries will save when the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);
  const supportedSpecies = useMemo(() => species.filter(hasReferenceImage), [species]);
  const visibleSpecies = useMemo(() => supportedSpecies
    .filter((item) => filter === 'All' || item.category === filter)
    .sort((left, right) => {
      const unlockOrder = Number(discovered.includes(right.id)) - Number(discovered.includes(left.id));
      return unlockOrder || left.common_name.localeCompare(right.common_name);
    }), [discovered, filter, supportedSpecies]);
  const selectedCategorySpecies = useMemo(() => supportedSpecies.filter((item) => item.category === category), [category, supportedSpecies]);
  const displayProgress = useMemo(() => ({
    ...progress,
    found: discovered.filter((id) => supportedSpecies.some((item) => item.id === id)).length,
    total: supportedSpecies.length,
  }), [discovered, progress, supportedSpecies]);
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
  const startDiscovery = () => {
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
  const discoveryPhoto = photoUri ? { uri: photoUri } : IMAGES.marmoset;
  const chooseSpecies = (item: Species) => { setSelected(item); open('confirm'); };
  const openQuiz = async () => {
    const fallback: QuizQuestion = {
      question: `Which statement about ${selected.common_name} is true?`,
      options: [selected.fun_fact, 'Wild animals are safest when we feed and touch them.', 'Every Malaysian wildlife species lives in the ocean.'],
      correct_index: 0,
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
    } catch { /* The fully populated offline fallback remains available. */ }
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
      const response = await fetch(`${apiBase}/api/v1/children/1/discoveries`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species_id: selected.id, location_label: 'Kuala Lumpur, Malaysia' }),
      });
      if (!response.ok) throw new Error('Unable to save');
      const result = await response.json() as { first_discovery?: boolean };
      if (result.first_discovery && !discovered.includes(selected.id)) {
        setDiscovered((current) => [...current, selected.id]);
        setProgress((current) => ({ ...current, found: current.found + 1, xp: current.xp + 100 }));
      }
      savePersonalPhoto();
      await refresh();
      open('success');
    } catch {
      if (!discovered.includes(selected.id)) {
        setDiscovered((current) => [...current, selected.id]);
        setProgress((current) => ({ ...current, found: current.found + 1, xp: current.xp + 100 }));
      }
      savePersonalPhoto();
      setNotice('Saved in demo mode. Start FastAPI to persist this discovery.');
      open('success');
    }
  };

  const Header = ({ title, back = true }: { title: string; back?: boolean }) => (
    <View style={styles.header}>
      {back ? <Tap label="Go back" style={styles.back} onPress={goBack}><Text style={styles.backText}>‹</Text></Tap> : <View style={styles.backSpacer} />}
      <Text style={styles.headerTitle}>{title}</Text><View style={styles.backSpacer} />
    </View>
  );
  const Bottom = () => <View style={styles.bottomNav}>
    <Nav icon="⌂" label="Home" active={screen === 'home'} onPress={() => resetTo('home')} />
    <Nav icon="⌕" label="Explore" onPress={() => {}} disabled />
    <Tap label="Open camera to record a discovery" style={styles.recordButton} onPress={startDiscovery}>
      <View style={styles.cameraNavIcon}><View style={styles.cameraNavLens} /></View>
    </Tap>
    <Nav icon="▣" label="Collection" active={screen === 'collection'} onPress={() => resetTo('collection')} />
    <Nav icon="♙" label="Profile" active={screen === 'progress'} onPress={() => resetTo('progress')} />
  </View>;
  const Page = ({ children, nav = false }: { children: React.ReactNode; nav?: boolean }) => <SafeAreaView style={styles.safe}><StatusBar barStyle="dark-content" /><View style={styles.page}>{children}</View>{nav && <Bottom />}</SafeAreaView>;

  if (loading) return <Page><View style={styles.loading}><ActivityIndicator color="#0BA84A" size="large" /><Text>Preparing your rainforest quest…</Text></View></Page>;
  if (screen === 'home') return <Page nav><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.brand}>RimbaQuest</Text>
    {notice && <Text style={styles.notice}>{notice}</Text>}
    <View style={styles.hero}><Text style={styles.level}>LV. 1 JUNGLE SCOUT</Text><Text style={styles.heroTitle}>Welcome, Explorer!</Text><Text style={styles.heroCopy}>Every discovery helps protect{`\n`}our beautiful rainforest wildlife!</Text><Text style={styles.mascot}>🌿</Text></View>
    <View style={styles.stats}><Stat value={`${displayProgress.found} / ${displayProgress.total}`} label="Wildlife Discovered" /><Stat value={`${displayProgress.xp}`} label="Explorer Points" /></View>
    <Section title="Begin Your Quest" /><Quest number="1" title="Record a Discovery" detail="Take a photo, then log your sighting!" onPress={startDiscovery} /><Quest number="2" title="View My Collection" detail="See your unlocked Wildlife Cards!" onPress={() => resetTo('collection')} />
    <Section title="Recent Captures" right="See All" />{recentCaptures.length ? <View style={styles.recent}>{recentCaptures.map((capture) => <View key={`${capture.id}-${capture.recorded_at}`} style={styles.recentItem}><Image source={imageFor(capture) ?? IMAGES.recent} style={styles.recentImage} /><View style={styles.recentCopy}><Text style={styles.cardTitle}>{capture.common_name}</Text><Text style={styles.muted}>{capture.location_label || 'Kuala Lumpur, Malaysia'}</Text></View></View>)}</View> : <View style={styles.recentEmpty}><Text style={styles.muted}>Your latest confirmed discoveries will appear here.</Text></View>}
  </ScrollView></Page>;
  if (screen === 'photo') return <Page><View style={styles.cameraPage}>{!cameraPermission ? <View style={styles.cameraPermission}><ActivityIndicator color="#FFFFFF" size="large" /></View> : !cameraPermission.granted ? <View style={styles.cameraPermission}><Text style={styles.cameraTitle}>Camera access is needed to record your wildlife discovery.</Text><Tap label="Allow camera" style={styles.primary} onPress={requestCameraPermission}><Text style={styles.primaryText}>Allow Camera</Text></Tap><Tap label="Go back" style={styles.cameraBackButton} onPress={goBack}><Text style={styles.cameraBackText}>Back</Text></Tap></View> : <><CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" /><View style={styles.cameraOverlay}><Tap label="Go back" style={styles.cameraBackButton} onPress={goBack}><Text style={styles.cameraBackText}>‹</Text></Tap><Text style={styles.cameraBrand}>RimbaQuest</Text><Text style={styles.cameraHint}>Point at wildlife & tap to capture</Text><Text style={styles.cameraPersonalRecord}>Photo is a personal record, not AI identification</Text><Tap label="Take photo" style={styles.shutter} onPress={takePhoto}><View style={styles.shutterInner} /></Tap></View></>}</View></Page>;
  if (screen === 'category') return <Page><ScrollView contentContainerStyle={styles.content}><Header title="Record a Discovery" /><Image source={discoveryPhoto} style={styles.heroImage} /><Text style={styles.caption}>Your personal discovery photo</Text><Text style={styles.pageTitle}>Choose a Wildlife Category</Text><Text style={styles.subTitle}>What type of animal did you see?</Text><View style={styles.grid}>{categories.map((item) => <Tap key={item} label={`Choose ${item}`} style={styles.categoryTile} onPress={() => { setCategory(item); open('species'); }}><Image source={IMAGES[item as keyof typeof IMAGES]} style={styles.tileImage} /><View style={styles.tileShade} /><Text style={styles.tileLabel}>{item}s</Text></Tap>)}</View></ScrollView></Page>;
  if (screen === 'species') return <Page><ScrollView contentContainerStyle={styles.content}><Header title="Record a Discovery" /><Image source={discoveryPhoto} style={styles.heroImage} /><Text style={styles.caption}>Your personal discovery photo</Text><Text style={styles.pageTitle}>Which {category.toLowerCase()} did you see?</Text><Text style={styles.subTitle}>Select the species that looks most like what you saw</Text><View style={styles.grid}>{selectedCategorySpecies.map((item) => <SpeciesCard key={item.id} item={item} onPress={() => chooseSpecies(item)} />)}</View></ScrollView></Page>;
  if (screen === 'confirm') return <Page><ScrollView contentContainerStyle={styles.content}><Header title="Confirm Discovery" /><Image source={discoveryPhoto} style={styles.confirmImage} /><Text style={styles.caption}>Your personal discovery photo</Text><Text style={styles.pageTitle}>{selected.common_name} <Text style={styles.categoryPill}>{selected.category}</Text></Text><Info label="LOCATION" value="Kuala Lumpur, Malaysia" /><Info label="DATE & TIME" value={new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })} /><Text style={styles.question}>Is this the species you saw?</Text><Text style={styles.subTitle}>Double-check the photo and details before you record your discovery.</Text><Tap label="Record my discovery" style={styles.primary} onPress={recordDiscovery}><Text style={styles.primaryText}>Yes, Record My Discovery!</Text></Tap><Tap label="Choose another species" style={styles.secondary} onPress={() => open('species')}><Text style={styles.secondaryText}>Choose Another Species</Text></Tap></ScrollView></Page>;
  if (screen === 'success') return <Page><ScrollView contentContainerStyle={[styles.content, styles.success]}><View style={{ alignSelf: 'stretch' }}><Header title="Discovery Recorded" /></View><Text style={styles.successSmall}>Success!</Text><Text style={styles.successTitle}>New Wildlife Discovered!</Text><Text style={styles.level}>Level 1 · Discovered</Text><Image source={imageFor(selected)!} style={styles.unlockImage} /><Text style={styles.pageTitle}>{selected.common_name}</Text><Text style={styles.scientific}>{selected.scientific_name}</Text><View style={styles.infoPair}><Info label="DATE RECORDED" value="Today" /><Info label="DISCOVERY STATUS" value="Confirmed" /></View><Text style={styles.xp}>+100 Explorer Experience Points</Text><Tap label="View my card" style={[styles.primary, styles.fullWidth]} onPress={() => open('about')}><Text style={styles.primaryText}>View My Card</Text></Tap><Tap label="View my collection" style={[styles.primary, styles.fullWidth]} onPress={() => resetTo('collection')}><Text style={styles.primaryText}>View My Collection</Text></Tap><Tap label="Record another discovery" style={styles.textButton} onPress={() => resetTo('category')}><Text style={styles.textButtonText}>Record Another Discovery</Text></Tap></ScrollView></Page>;
  if (screen === 'collection') return <Page nav><ScrollView contentContainerStyle={styles.content}><Header title="My Collection" /><ProgressCard progress={displayProgress} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{['All', ...categories].map((item) => <Tap key={item} label={`Filter ${item}`} style={[styles.chip, filter === item && styles.chipActive]} onPress={() => setFilter(item)}><Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{item}s</Text></Tap>)}</ScrollView><View style={styles.grid}>{visibleSpecies.map((item) => discovered.includes(item.id) ? <SpeciesCard key={item.id} item={item} onPress={() => { setSelected(item); open('about'); }} /> : <LockedCard key={item.id} item={item} onPress={() => { setSelected(item); open('locked'); }} />)}</View></ScrollView></Page>;
  if (screen === 'about' || screen === 'facts' || screen === 'gallery') return <Page nav><ScrollView contentContainerStyle={styles.content}><Header title={selected.common_name} /><View style={styles.tabs}>{([['about', 'About'], ['facts', 'Fun Facts'], ['gallery', 'Gallery']] as [Screen, string][]).map(([key, label]) => <Tap key={key} label={label} style={[styles.tab, screen === key && styles.tabActive]} onPress={() => open(key)}><Text style={[styles.tabText, screen === key && styles.tabTextActive]}>{label}</Text></Tap>)}</View>{screen === 'about' && <About item={selected} />}{screen === 'facts' && <Facts item={selected} onPlay={() => { void openQuiz(); }} />}{screen === 'gallery' && <Gallery photos={galleryPhotos[selected.id] ?? []} />}</ScrollView></Page>;
  if (screen === 'quiz') return <Page><ScrollView contentContainerStyle={styles.content}><Header title={`${selected.common_name} Quiz`} /><Quiz item={selected} question={quizQuestion} answer={quizAnswer} onAnswer={setQuizAnswer} onDone={() => open('facts')} /></ScrollView></Page>;
  if (screen === 'locked') return <Page nav><ScrollView contentContainerStyle={styles.content}><Header title="Undiscovered" /><View style={styles.lockedDetail}><Image source={imageFor(selected)!} style={styles.lockedImage} /><Text style={styles.pageTitle}>{selected.common_name} <Text style={styles.categoryPill}>{selected.category}</Text></Text><Text style={styles.scientific}>{selected.scientific_name}</Text><Text style={styles.body}>{selected.habitat}</Text><Info label="DISCOVERY HINT" value="Keep exploring safely and observe wildlife from a respectful distance." /><Text style={styles.hint}>Keep exploring! Your first confirmed discovery unlocks this card.</Text></View></ScrollView></Page>;
  return <Page nav><ScrollView contentContainerStyle={styles.content}><Header title="My Progress" /><ProgressCard progress={displayProgress} /><Section title="CATEGORY PROGRESS" />{categories.map((item) => { const items = supportedSpecies.filter((speciesItem) => speciesItem.category === item); const found = items.filter((speciesItem) => discovered.includes(speciesItem.id)).length; return <View style={styles.progressRow} key={item}><Text style={styles.cardTitle}>{item}s</Text><Text style={styles.muted}>{found} / {items.length} Found</Text></View>; })}<Text style={styles.hint}>Spot more wildlife to level up your scout status!</Text><Section title="ACHIEVEMENTS UNLOCKED" /><View style={styles.badges}><Text style={styles.badge}>🏅 First Discovery</Text><Text style={styles.badge}>🌱 Wildlife Friend</Text></View></ScrollView></Page>;
}

function Tap({ children, onPress, style, label, disabled = false }: { children: React.ReactNode; onPress: () => void; style?: object | object[]; label: string; disabled?: boolean }) { return <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} onPress={onPress} style={({ pressed }) => [style, pressed && !disabled && styles.pressed]}>{children}</Pressable>; }
function Nav({ icon, label, onPress, active = false, disabled = false }: { icon: string; label: string; onPress: () => void; active?: boolean; disabled?: boolean }) { return <Tap label={label} onPress={onPress} disabled={disabled} style={styles.navItem}><Text style={[styles.navIcon, active && styles.navActive, disabled && styles.navDisabled]}>{icon}</Text><Text style={[styles.navLabel, active && styles.navActive, disabled && styles.navDisabled]}>{label}</Text></Tap>; }
function Stat({ value, label }: { value: string; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function Section({ title, right }: { title: string; right?: string }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{right && <Text style={styles.seeAll}>{right}</Text>}</View>; }
function Quest({ number, title, detail, onPress }: { number: string; title: string; detail: string; onPress: () => void }) { return <Tap label={title} style={styles.quest} onPress={onPress}><Text style={styles.questNumber}>{number}</Text><View><Text style={styles.cardTitle}>{title}</Text><Text style={styles.muted}>{detail}</Text></View></Tap>; }
function Info({ label, value }: { label: string; value: string }) { return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }
function SpeciesCard({ item, onPress }: { item: Species; onPress: () => void }) { return <Tap label={`View ${item.common_name}`} style={styles.speciesCard} onPress={onPress}><Image source={imageFor(item)!} style={styles.speciesImage} /><Text numberOfLines={2} style={styles.cardTitle}>{item.common_name}</Text><Text style={styles.categoryText}>{item.category}</Text></Tap>; }
function LockedCard({ item, onPress }: { item: Species; onPress: () => void }) { return <Tap label={`Preview undiscovered ${item.common_name}`} style={styles.speciesCard} onPress={onPress}><Image source={imageFor(item)!} style={[styles.speciesImage, styles.lockedSpeciesImage]} /><View style={styles.lockedOverlay}><Text style={styles.lockIcon}>🔒</Text><Text style={styles.lockedLabel}>UNDISCOVERED</Text></View><Text numberOfLines={2} style={styles.cardTitle}>{item.common_name}</Text><Text style={styles.muted}>{item.category}</Text></Tap>; }
function ProgressCard({ progress }: { progress: { found: number; total: number; xp: number } }) { const percentage = progress.total ? Math.min(100, Math.round((progress.found / progress.total) * 100)) : 0; return <View style={styles.progressCard}><View style={styles.progressTop}><View><Text style={styles.infoLabel}>OVERALL PROGRESS</Text><Text style={styles.progressValue}>{progress.found} / {progress.total}</Text></View><Text style={styles.unlocked}>{percentage}% Unlocked</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${percentage}%` }]} /></View><View style={styles.infoPair}><Info label="EXPLORER POINTS" value={`${progress.xp} XP`} /><Info label="CURRENT LEVEL" value="LV. 1 Scout" /></View></View>; }
function ecologicalRole(item: Species) { if (item.category === 'Butterfly') return 'Helps pollinate flowering plants while moving between gardens and forest edges.'; if (item.category === 'Bird') return 'Helps spread seeds and supports a healthy rainforest food web.'; if (item.category === 'Reptile') return 'Helps keep the food web in balance as part of its wetland and forest habitat.'; return 'Plays an important role in Malaysia’s forest food web and healthy habitat.'; }
function About({ item }: { item: Species }) { return <><View style={styles.badges}><Text style={styles.badge}>Level 1 · Discovered</Text><Text style={styles.badge}>{item.category}</Text></View><Info label="SCIENTIFIC NAME" value={item.scientific_name} />{item.act716_status && <Info label="MALAYSIAN PROTECTION STATUS" value={item.act716_status} />}<Info label="HABITAT" value={item.habitat} /><Info label="DIET" value={item.diet} /><Info label="ECOLOGICAL ROLE" value={ecologicalRole(item)} /><Info label="ABOUT" value={`Learn about ${item.common_name} while observing wildlife safely and giving every animal plenty of space.`} /></>; }
function Facts({ item, onPlay }: { item: Species; onPlay: () => void }) { return <><View style={styles.quiz}><Text style={styles.quizLabel}>QUIZ</Text><Text style={styles.quizTitle}>Test Your Knowledge!</Text><Text style={styles.muted}>Take a quiz about {item.common_name} and earn XP!</Text><Tap label="Play quiz" style={styles.quizButton} onPress={onPlay}><Text style={styles.primaryText}>▶ Play Quiz</Text></Tap></View><Section title="Fun Facts" />{[item.fun_fact, 'Wild animals need space and quiet to thrive.', 'Every careful observation can help us learn.'].map((fact) => <Text key={fact} style={styles.fact}>• {fact}</Text>)}</>; }
function Quiz({ item, question, answer, onAnswer, onDone }: { item: Species; question: QuizQuestion | null; answer: number | null; onAnswer: (index: number) => void; onDone: () => void }) { const activeQuestion = question ?? { question: `Which statement about ${item.common_name} is true?`, options: [item.fun_fact], correct_index: 0 }; const correct = answer === activeQuestion.correct_index; return <View style={styles.quiz}><Text style={styles.quizLabel}>QUESTION 1 OF 1</Text><Text style={styles.quizTitle}>{activeQuestion.question}</Text>{activeQuestion.options.map((option, index) => <Tap key={`${option}-${index}`} label={`Answer ${index + 1}`} style={[styles.secondary, styles.quizOption, answer === index && styles.quizOptionSelected]} onPress={() => onAnswer(index)}><Text style={[styles.secondaryText, styles.quizOptionText, answer === index && styles.quizOptionTextSelected]}>{option}</Text></Tap>)}{answer !== null && <><Text style={styles.hint}>{correct ? 'Great job! That is correct.' : (activeQuestion.explanation || 'Not quite. Read the fun facts and try again!')}</Text><Tap label="Return to fun facts" style={styles.primary} onPress={onDone}><Text style={styles.primaryText}>Back to Fun Facts</Text></Tap></>}</View>; }
function Gallery({ photos }: { photos: string[] }) { return <><Text style={styles.subTitle}>Your past personal discovery photos for this species.</Text>{photos.length ? <View style={styles.gallery}>{photos.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={styles.galleryImage} />)}</View> : <View style={styles.galleryEmpty}><Text style={styles.galleryEmptyTitle}>No personal photos yet</Text><Text style={styles.muted}>Record this species again to add another photo to its gallery.</Text></View>}</>; }

const cameraStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#182019', overflow: 'hidden' },
  permission: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: '#182019' },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center', lineHeight: 26 },
  preview: { flex: 1 },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 25, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)' },
  backButton: { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.52)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#FFFFFF', fontSize: 28, lineHeight: 30, fontWeight: '700' },
  brand: { position: 'absolute', top: 28, color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  hint: { position: 'absolute', top: 78, color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.62)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7, fontSize: 11, fontWeight: '700' },
  personalRecord: { color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.62)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 10, textAlign: 'center', overflow: 'hidden', marginBottom: 18 },
  shutter: { width: 74, height: 74, borderRadius: 37, backgroundColor: 'rgba(255,255,255,0.82)', padding: 5, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: '100%', height: '100%', borderRadius: 32, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#D9E2DB' },
});

const styles: any = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' }, page: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: 500, backgroundColor: '#FFFFFF' }, content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 100 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }, brand: { fontSize: 22, fontWeight: '800', color: '#182019', marginVertical: 17 }, notice: { color: '#8B5D00', backgroundColor: '#FFF7DD', borderRadius: 10, padding: 10, fontSize: 12, marginBottom: 10 }, hero: { minHeight: 160, borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 25, padding: 20, position: 'relative', overflow: 'hidden' }, level: { alignSelf: 'flex-start', overflow: 'hidden', color: '#087B35', backgroundColor: '#DFF6E7', fontSize: 10, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }, heroTitle: { color: '#1B211C', fontSize: 29, lineHeight: 32, fontWeight: '800', marginTop: 10 }, heroCopy: { color: '#66706A', fontSize: 14, lineHeight: 21, marginTop: 10 }, mascot: { position: 'absolute', right: 18, bottom: 20, fontSize: 50 }, stats: { flexDirection: 'row', gap: 12, marginVertical: 19 }, stat: { flex: 1, borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 18, padding: 15 }, statValue: { color: '#0BA84A', fontSize: 23, fontWeight: '800' }, statLabel: { color: '#66706A', fontSize: 11, marginTop: 4 }, section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 8 }, sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1B211C' }, seeAll: { color: '#0BA84A', fontSize: 12, fontWeight: '700' }, quest: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }, questNumber: { width: 30, height: 30, lineHeight: 30, textAlign: 'center', color: '#FFFFFF', backgroundColor: '#35B85E', borderRadius: 15, fontWeight: '800' }, cardTitle: { color: '#1B211C', fontSize: 14, fontWeight: '800' }, muted: { color: '#707872', fontSize: 11, marginTop: 3 }, recent: { borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 15, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' }, recentImage: { width: 78, height: 78, marginRight: 12 }, header: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, headerTitle: { fontSize: 20, fontWeight: '800', color: '#1B211C' }, back: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#DFE7E1', alignItems: 'center', justifyContent: 'center' }, backSpacer: { width: 38 }, backText: { fontSize: 32, color: '#1B211C', lineHeight: 34 }, heroImage: { width: 155, height: 155, borderRadius: 20, alignSelf: 'center', marginBottom: 6 }, confirmImage: { width: 180, height: 180, borderRadius: 20, alignSelf: 'center', marginBottom: 17 }, caption: { color: '#69716B', fontSize: 11, textAlign: 'center', marginBottom: 20 }, pageTitle: { color: '#1B211C', fontSize: 22, lineHeight: 27, fontWeight: '800', marginTop: 4 }, subTitle: { color: '#68716C', fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 17 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 13 }, categoryTile: { width: '48%', height: 151, borderRadius: 19, overflow: 'hidden', position: 'relative', backgroundColor: '#E4E8E5' }, tileImage: { width: '100%', height: '100%' }, tileShade: { position: 'absolute', left: 0, right: 0, bottom: 0, top: '45%', backgroundColor: 'rgba(0,0,0,0.48)' }, tileLabel: { position: 'absolute', bottom: 17, left: 0, right: 0, textAlign: 'center', color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, speciesCard: { width: '48%', minHeight: 155, borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 17, overflow: 'hidden', paddingBottom: 9, backgroundColor: '#FFFFFF' }, speciesImage: { width: '100%', height: 94 }, lockedSpeciesImage: { opacity: 0.34 }, lockedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 94, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)' }, categoryText: { color: '#0BA84A', fontSize: 11, paddingHorizontal: 10, marginTop: 3 }, lockedPreview: { height: 94, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E9EEEA' }, lockIcon: { fontSize: 20 }, lockedLabel: { color: '#68716C', fontSize: 9, fontWeight: '800', marginTop: 3 }, categoryPill: { fontSize: 10, color: '#087B35', backgroundColor: '#DFF6E7' }, info: { borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 13, padding: 13, marginTop: 11 }, infoLabel: { color: '#78817B', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 }, infoValue: { color: '#1B211C', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 5 }, question: { color: '#1B211C', fontSize: 14, fontWeight: '800', marginTop: 18 }, primary: { minHeight: 50, marginTop: 16, borderRadius: 25, backgroundColor: '#0BA84A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }, primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }, secondary: { minHeight: 48, marginTop: 9, borderRadius: 24, backgroundColor: '#FFFFFF', borderColor: '#C8D1CA', borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: '#1B211C', fontSize: 14, fontWeight: '700' }, success: { alignItems: 'center', paddingTop: 34 }, successSmall: { color: '#1B211C', fontSize: 16, fontWeight: '800' }, successTitle: { color: '#0BA84A', fontSize: 23, fontWeight: '800', marginTop: 7 }, unlockImage: { width: 130, height: 130, borderRadius: 15, marginVertical: 15 }, scientific: { color: '#68716C', fontStyle: 'italic', fontSize: 12, marginTop: 4 }, infoPair: { flexDirection: 'row', alignSelf: 'stretch', gap: 8, marginTop: 6 }, xp: { alignSelf: 'stretch', color: '#087B35', borderWidth: 1, borderColor: '#CBECD6', backgroundColor: '#F4FFF7', borderRadius: 11, textAlign: 'center', fontSize: 12, fontWeight: '700', padding: 11, marginTop: 14 }, textButton: { paddingVertical: 13, alignItems: 'center' }, textButtonText: { color: '#0BA84A', fontWeight: '800', fontSize: 13 }, progressCard: { borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12 }, progressTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, progressValue: { fontSize: 24, color: '#1B211C', fontWeight: '800', marginTop: 4 }, unlocked: { color: '#0BA84A', fontSize: 12, fontWeight: '800' }, track: { height: 7, backgroundColor: '#E8EEEA', borderRadius: 5, overflow: 'hidden', marginTop: 13 }, fill: { height: '100%', backgroundColor: '#0BA84A', borderRadius: 5 }, chips: { gap: 8, paddingBottom: 12 }, chip: { borderRadius: 18, backgroundColor: '#F0F4F1', paddingHorizontal: 11, paddingVertical: 7 }, chipActive: { backgroundColor: '#0BA84A' }, chipText: { fontSize: 11, color: '#607068', fontWeight: '700' }, chipTextActive: { color: '#FFFFFF' }, tabs: { flexDirection: 'row', gap: 18, borderBottomWidth: 1, borderBottomColor: '#E2E7E3', marginBottom: 15 }, tab: { paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' }, tabActive: { borderBottomColor: '#0BA84A' }, tabText: { color: '#6A736D', fontSize: 12 }, tabTextActive: { color: '#0BA84A', fontWeight: '800' }, badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 2 }, badge: { color: '#31613F', backgroundColor: '#EDF5EF', borderRadius: 15, fontSize: 10, paddingHorizontal: 9, paddingVertical: 6, overflow: 'hidden' }, quiz: { borderColor: '#CBECD6', borderWidth: 1, backgroundColor: '#F4FFF7', borderRadius: 16, padding: 16 }, quizLabel: { color: '#087B35', fontSize: 10, fontWeight: '800' }, quizTitle: { fontSize: 19, color: '#1B211C', fontWeight: '800', marginTop: 6 }, quizButton: { backgroundColor: '#0BA84A', alignSelf: 'flex-start', borderRadius: 18, marginTop: 13, paddingVertical: 9, paddingHorizontal: 14 }, fact: { color: '#273229', fontSize: 13, lineHeight: 20, borderBottomWidth: 1, borderBottomColor: '#E6EAE7', paddingVertical: 13 }, gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, galleryImage: { width: '48%', height: 140, borderRadius: 14 }, lockedDetail: { borderWidth: 1, borderColor: '#DFE7E1', borderRadius: 22, padding: 13 }, lockedImage: { width: '100%', height: 245, borderRadius: 16, opacity: 0.6 }, body: { color: '#68716C', fontSize: 13, lineHeight: 19, marginTop: 13 }, hint: { color: '#117B3A', backgroundColor: '#F0FAF3', borderColor: '#CBECD6', borderWidth: 1, borderRadius: 10, fontSize: 11, lineHeight: 16, padding: 11, marginTop: 14 }, progressRow: { borderColor: '#DFE7E1', borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }, bottomNav: { position: 'absolute', height: 71, bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E1E7E2', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }, navItem: { width: 52, alignItems: 'center', justifyContent: 'center', minHeight: 48 }, navIcon: { color: '#879089', fontSize: 19 }, navLabel: { color: '#879089', fontSize: 9, marginTop: 2 }, navActive: { color: '#0BA84A', fontWeight: '800' }, recordButton: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#0BA84A', alignItems: 'center', justifyContent: 'center', marginTop: -25, shadowColor: '#0BA84A', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }, recordIcon: { color: '#FFFFFF', fontSize: 29, lineHeight: 31 }, fullWidth: { alignSelf: 'stretch' }, quizOption: { minHeight: 58, paddingHorizontal: 16, paddingVertical: 12 }, quizOptionSelected: { backgroundColor: '#0BA84A', borderColor: '#0BA84A' }, quizOptionText: { textAlign: 'center', lineHeight: 18 }, quizOptionTextSelected: { color: '#FFFFFF' }, pressed: { opacity: 0.72 },
});
Object.assign(styles, {
  cameraPage: cameraStyles.page,
  cameraPermission: cameraStyles.permission,
  cameraTitle: cameraStyles.title,
  cameraPreview: cameraStyles.preview,
  cameraOverlay: cameraStyles.overlay,
  cameraBackButton: cameraStyles.backButton,
  cameraBackText: cameraStyles.backText,
  cameraBrand: cameraStyles.brand,
  cameraHint: cameraStyles.hint,
  cameraPersonalRecord: cameraStyles.personalRecord,
  shutter: cameraStyles.shutter,
  shutterInner: cameraStyles.shutterInner,
  cameraNavIcon: { width: 25, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  cameraNavLens: { width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#FFFFFF' },
  galleryEmpty: { borderWidth: 1, borderColor: '#CBECD6', backgroundColor: '#F4FFF7', borderRadius: 14, padding: 18, alignItems: 'center' },
  galleryEmptyTitle: { color: '#087B35', fontSize: 15, fontWeight: '800', marginBottom: 5 },
  navDisabled: { color: '#B9C1BC' },
});
