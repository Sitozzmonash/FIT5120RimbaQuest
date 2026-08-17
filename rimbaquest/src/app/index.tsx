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
  {"id":"sp_blue_breasted_quail","common_name":"Blue-breasted Quail","scientific_name":"Coturnix chinensis","category":"Bird","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
  {"id":"sp_blue_headed_pitta","common_name":"Blue-headed Pitta","scientific_name":"Hydrornis baudii","category":"Bird","habitat":"Malaysian forests and suitable natural habitat.","diet":"A natural diet suited to its forest habitat.","fun_fact":"This species is part of Malaysia’s diverse wildlife."},
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
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Record<string, string[]>>({});
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const refresh = async () => {
    try {
      const [speciesResponse, collectionResponse, progressResponse] = await Promise.all([
        fetch(`${apiBase}/api/v1/species`),
        fetch(`${apiBase}/api/v1/children/1/collection`),
        fetch(`${apiBase}/api/v1/children/1/progress`),
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
    } catch {
      setNotice('You are exploring in offline demo mode. Discoveries will save when the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);
  const supportedSpecies = useMemo(() => species.filter(hasReferenceImage), [species]);
  const visibleSpecies = useMemo(() => supportedSpecies.filter((item) => filter === 'All' || item.category === filter), [filter, supportedSpecies]);
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
    <Section title="Recent Captures" right="See All" /><View style={styles.recent}><Image source={IMAGES.recent} style={styles.recentImage} /><View><Text style={styles.cardTitle}>Common Marmoset</Text><Text style={styles.muted}>Kuala Lumpur, Malaysia</Text></View></View>
  </ScrollView></Page>;
  if (screen === 'photo') return <Page><View style={styles.cameraPage}>{!cameraPermission ? <View style={styles.cameraPermission}><ActivityIndicator color="#FFFFFF" size="large" /></View> : !cameraPermission.granted ? <View style={styles.cameraPermission}><Text style={styles.cameraTitle}>Camera access is needed to record your wildlife discovery.</Text><Tap label="Allow camera" style={styles.primary} onPress={requestCameraPermission}><Text style={styles.primaryText}>Allow Camera</Text></Tap><Tap label="Go back" style={styles.cameraBackButton} onPress={goBack}><Text style={styles.cameraBackText}>Back</Text></Tap></View> : <><CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" /><View style={styles.cameraOverlay}><Tap label="Go back" style={styles.cameraBackButton} onPress={goBack}><Text style={styles.cameraBackText}>‹</Text></Tap><Text style={styles.cameraBrand}>RimbaQuest</Text><Text style={styles.cameraHint}>Point at wildlife & tap to capture</Text><Text style={styles.cameraPersonalRecord}>Photo is a personal record, not AI identification</Text><Tap label="Take photo" style={styles.shutter} onPress={takePhoto}><View style={styles.shutterInner} /></Tap></View></>}</View></Page>;
  if (screen === 'category') return <Page><ScrollView contentContainerStyle={styles.content}><Header title="Record a Discovery" /><Image source={discoveryPhoto} style={styles.heroImage} /><Text style={styles.caption}>Your personal discovery photo</Text><Text style={styles.pageTitle}>Choose a Wildlife Category</Text><Text style={styles.subTitle}>What type of animal did you see?</Text><View style={styles.grid}>{categories.map((item) => <Tap key={item} label={`Choose ${item}`} style={styles.categoryTile} onPress={() => { setCategory(item); open('species'); }}><Image source={IMAGES[item as keyof typeof IMAGES]} style={styles.tileImage} /><View style={styles.tileShade} /><Text style={styles.tileLabel}>{item}s</Text></Tap>)}</View></ScrollView></Page>;
  if (screen === 'species') return <Page><ScrollView contentContainerStyle={styles.content}><Header title="Record a Discovery" /><Image source={discoveryPhoto} style={styles.heroImage} /><Text style={styles.caption}>Your personal discovery photo</Text><Text style={styles.pageTitle}>Which {category.toLowerCase()} did you see?</Text><Text style={styles.subTitle}>Select the species that looks most like what you saw</Text><View style={styles.grid}>{selectedCategorySpecies.map((item) => <SpeciesCard key={item.id} item={item} onPress={() => chooseSpecies(item)} />)}</View></ScrollView></Page>;
  if (screen === 'confirm') return <Page><ScrollView contentContainerStyle={styles.content}><Header title="Confirm Discovery" /><Image source={discoveryPhoto} style={styles.confirmImage} /><Text style={styles.caption}>Your personal discovery photo</Text><Text style={styles.pageTitle}>{selected.common_name} <Text style={styles.categoryPill}>{selected.category}</Text></Text><Info label="LOCATION" value="Kuala Lumpur, Malaysia" /><Info label="DATE & TIME" value={new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })} /><Text style={styles.question}>Is this the species you saw?</Text><Text style={styles.subTitle}>Double-check the photo and details before you record your discovery.</Text><Tap label="Record my discovery" style={styles.primary} onPress={recordDiscovery}><Text style={styles.primaryText}>Yes, Record My Discovery!</Text></Tap><Tap label="Choose another species" style={styles.secondary} onPress={() => open('species')}><Text style={styles.secondaryText}>Choose Another Species</Text></Tap></ScrollView></Page>;
  if (screen === 'success') return <Page><ScrollView contentContainerStyle={[styles.content, styles.success]}><View style={{ alignSelf: 'stretch' }}><Header title="Discovery Recorded" /></View><Text style={styles.successSmall}>Success!</Text><Text style={styles.successTitle}>New Wildlife Discovered!</Text><Text style={styles.level}>Level 1 · Discovered</Text><Image source={imageFor(selected)!} style={styles.unlockImage} /><Text style={styles.pageTitle}>{selected.common_name}</Text><Text style={styles.scientific}>{selected.scientific_name}</Text><View style={styles.infoPair}><Info label="DATE RECORDED" value="Today" /><Info label="DISCOVERY STATUS" value="Confirmed" /></View><Text style={styles.xp}>+100 Explorer Experience Points</Text><Tap label="View my card" style={[styles.primary, styles.fullWidth]} onPress={() => open('about')}><Text style={styles.primaryText}>View My Card</Text></Tap><Tap label="View my collection" style={[styles.primary, styles.fullWidth]} onPress={() => resetTo('collection')}><Text style={styles.primaryText}>View My Collection</Text></Tap><Tap label="Record another discovery" style={styles.textButton} onPress={() => resetTo('category')}><Text style={styles.textButtonText}>Record Another Discovery</Text></Tap></ScrollView></Page>;
  if (screen === 'collection') return <Page nav><ScrollView contentContainerStyle={styles.content}><Header title="My Collection" /><ProgressCard progress={displayProgress} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{['All', ...categories].map((item) => <Tap key={item} label={`Filter ${item}`} style={[styles.chip, filter === item && styles.chipActive]} onPress={() => setFilter(item)}><Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{item}s</Text></Tap>)}</ScrollView><View style={styles.grid}>{visibleSpecies.map((item) => discovered.includes(item.id) ? <SpeciesCard key={item.id} item={item} onPress={() => { setSelected(item); open('about'); }} /> : <LockedCard key={item.id} item={item} onPress={() => { setSelected(item); open('locked'); }} />)}</View></ScrollView></Page>;
  if (screen === 'about' || screen === 'facts' || screen === 'gallery') return <Page nav><ScrollView contentContainerStyle={styles.content}><Header title={selected.common_name} /><View style={styles.tabs}>{([['about', 'About'], ['facts', 'Fun Facts'], ['gallery', 'Gallery']] as [Screen, string][]).map(([key, label]) => <Tap key={key} label={label} style={[styles.tab, screen === key && styles.tabActive]} onPress={() => open(key)}><Text style={[styles.tabText, screen === key && styles.tabTextActive]}>{label}</Text></Tap>)}</View>{screen === 'about' && <About item={selected} />}{screen === 'facts' && <Facts item={selected} onPlay={() => { setQuizAnswer(null); open('quiz'); }} />}{screen === 'gallery' && <Gallery photos={galleryPhotos[selected.id] ?? []} />}</ScrollView></Page>;
  if (screen === 'quiz') return <Page><ScrollView contentContainerStyle={styles.content}><Header title={`${selected.common_name} Quiz`} /><Quiz item={selected} answer={quizAnswer} onAnswer={setQuizAnswer} onDone={() => open('facts')} /></ScrollView></Page>;
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
function Quiz({ item, answer, onAnswer, onDone }: { item: Species; answer: number | null; onAnswer: (index: number) => void; onDone: () => void }) { const options = [item.fun_fact, 'Wild animals are safest when we feed and touch them.', 'Every Malaysian wildlife species lives in the ocean.']; const correct = answer === 0; return <View style={styles.quiz}><Text style={styles.quizLabel}>QUESTION 1 OF 1</Text><Text style={styles.quizTitle}>Which statement about {item.common_name} is true?</Text>{options.map((option, index) => <Tap key={option} label={`Answer ${index + 1}`} style={[styles.secondary, styles.quizOption, answer === index && styles.quizOptionSelected]} onPress={() => onAnswer(index)}><Text style={[styles.secondaryText, styles.quizOptionText, answer === index && styles.quizOptionTextSelected]}>{option}</Text></Tap>)}{answer !== null && <><Text style={styles.hint}>{correct ? 'Great job! That is correct.' : 'Not quite. Read the fun facts and try again!'}</Text><Tap label="Return to fun facts" style={styles.primary} onPress={onDone}><Text style={styles.primaryText}>Back to Fun Facts</Text></Tap></>}</View>; }
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
