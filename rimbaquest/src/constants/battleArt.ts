import speciesBattleArtRaw from './speciesBattleArt.json';

export type PixelLayer = readonly [color: string, path: string];
export type BattleArt = {
  name: string;
  layers: readonly PixelLayer[];
  archetype?: string;
  status: 'bespoke' | 'composed' | 'unavailable';
};

export type SpeciesArtMetadata = {
  species_id: string;
  name: string;
  category: 'Bird' | 'Butterfly' | 'Mammal' | 'Reptile';
  role: 'Agile' | 'Balanced' | 'Control' | 'Defense' | 'Guardian' | 'Power' | 'Precision' | 'Support' | 'Tank' | 'Trickster';
  archetype: string;
  asset_status: 'bespoke' | 'composed';
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    underbelly: string;
  };
  features: string[];
  markings: string;
  ear_variant: string;
  tail_variant: string;
  beak_variant: string;
};

export const SPECIES_BATTLE_ART_CATALOGUE: Record<string, SpeciesArtMetadata> =
  speciesBattleArtRaw as unknown as Record<string, SpeciesArtMetadata>;

const ink = '#23333D';
const cream = '#FFF0CE';
const white = '#FFFDF0';

// 7 Bespoke Hand-Crafted Artworks
const tiger: BattleArt = {
  name: 'Malayan Tiger',
  archetype: 'feline',
  status: 'bespoke',
  layers: [
    [ink, 'M3 16h3v8h4v-9h5v-5h-1V5h5v2h6V5h5v7h1v11h-4v5h-5v-2h-4v2h-6v-3H6v-2H3z'],
    ['#D67931', 'M9 18h15v7H9z M4 17h2v5h3v2H5v-2H4z M14 25h3v2h-3z M23 25h3v2h-3z'],
    ['#FFB441', 'M15 6h3v4h8V7h3v6h1v8h-3v3H17v-3h-2z M11 17h7v6h-7z'],
    ['#FFD27B', 'M17 11h10v3H17z M10 18h6v2h-6z'],
    [cream, 'M16 18h5v-2h5v2h3v4h-3v2h-8v-2h-2z M11 23h5v2h-5z M22 25h4v2h-4z'],
    [ink, 'M18 10h2v5h-2z M23 10h2v4h-2z M27 13h3v2h-3z M16 15h2v3h-2z M10 18h2v4h-2z M14 17h2v3h-2z M5 20h2v2H5z M21 22h4v1h-4z'],
    [white, 'M19 17h3v3h-3z M26 16h3v3h-3z'],
    [ink, 'M20 18h2v2h-2z M27 17h2v2h-2z M23 20h3v2h-3z'],
    ['#F29675', 'M17 20h2v1h-2z M27 20h2v1h-2z M16 7h1v2h-1z M27 8h1v2h-1z'],
  ],
};

const elephant: BattleArt = {
  name: 'Asian Elephant',
  archetype: 'elephant',
  status: 'bespoke',
  layers: [
    [ink, 'M3 14h5V8h5V5h11v2h4v5h3v12h-2v3h-5v-5h-3v6h-5v-3h-5v3H6v-6H3z'],
    ['#7496A7', 'M5 15h15v8h-2v4h-2v-3h-6v3H7v-6H5z M13 7h10v2h4v5h3v10h-2v2h-3v-9H13z'],
    ['#A9C5CA', 'M14 6h9v3h3v6H14z M7 15h8v4H7z M27 16h2v8h-2z'],
    ['#426D83', 'M10 10h8v11h-6v-2h-2z'],
    ['#D2BDC0', 'M11 11h5v8h-4v-2h-1z'],
    ['#A9C5CA', 'M11 10h5v2h-4v6h-1z'],
    [white, 'M21 13h3v4h-3z'],
    [ink, 'M22 14h2v3h-2z M26 24h2v1h-2z'],
    [cream, 'M23 18h2v4h-2z M20 19h2v2h-2z'],
    ['#D5E1D3', 'M7 25h2v2H7z M16 25h2v2h-2z'],
    ['#D5AAB2', 'M22 17h2v1h-2z'],
  ],
};

const hornbill: BattleArt = {
  name: 'Oriental Pied Hornbill',
  archetype: 'hornbill',
  status: 'bespoke',
  layers: [
    [ink, 'M5 16h5v-5h5V5h4V3h5v3h4v3h3v5h-6v5h-3v5h-5v4h-3v-4h-3v-3H6v2H3v-4h2z'],
    ['#3F5260', 'M11 13h10v9h-8v-3h-3z M16 8h8v8h-8z'],
    [white, 'M13 15h8v6h-7v-2h-1z M4 20h4v2H4z M11 20h2v2h-2z'],
    ['#1B2F3D', 'M7 16h9v2h-2v3h-3v-2H7z M16 8h7v5h-7z'],
    ['#F3B64F', 'M23 9h5v1h2v3h-7z M18 4h5v3h4v2h-8z'],
    ['#FFE5A1', 'M19 4h3v2h-3z M24 10h5v1h-5z'],
    ['#DA7E3A', 'M24 12h5v1h-5z M23 7h3v1h-3z'],
    [white, 'M20 9h2v3h-2z'],
    [ink, 'M21 10h1v2h-1z M15 24h1v3h-1z M19 23h1v3h-1z'],
    ['#E3A650', 'M14 27h4v1h-4z M18 26h4v1h-4z'],
  ],
};

const python: BattleArt = {
  name: 'Reticulated Python',
  archetype: 'python',
  status: 'bespoke',
  layers: [
    [ink, 'M5 20h8v-4h6v-5h-2V6h4V4h7v2h3v7h-5v3h2v4h2v6h-3v2H5v-2H2v-4h3z'],
    ['#829754', 'M5 22h10v-5h5v-5h-1V7h3V5h5v2h3v5h-5v6h2v3h2v4h-4v2H6v-2H3v-2h2z'],
    ['#BBCA79', 'M21 7h7v4h-7z M17 17h3v5h5v2H11v-2h6z M5 24h4v2H5z'],
    ['#576D47', 'M8 22h6v2H8z M20 20h6v2h-6z M23 13h2v5h-2z'],
    ['#D7B46C', 'M6 22h3v2H6z M11 25h3v2h-3z M16 23h3v2h-3z M24 23h3v2h-3z M20 17h3v2h-3z M21 12h2v2h-2z'],
    [ink, 'M7 23h1v1H7z M12 26h1v1h-1z M17 24h1v1h-1z M25 24h1v1h-1z'],
    [cream, 'M23 10h7v2h-7z'],
    [white, 'M25 7h3v3h-3z'],
    [ink, 'M26 8h2v2h-2z M29 11h1v1h-1z'],
    ['#EAAC84', 'M23 10h2v1h-2z'],
  ],
};

const otter: BattleArt = {
  name: 'Asian Small-clawed Otter',
  archetype: 'otter',
  status: 'bespoke',
  layers: [
    [ink, 'M1 23h7v-4h4v-6h4V8h2V5h4v2h4V6h4v6h1v9h-4v4h-5v3h-5v-3h-5v2H7v-2H1z'],
    ['#8F6450', 'M3 23h7v-3h4v-5h5V9h2V7h2v2h4V8h2v5h1v7h-4v4h-6v3h-2v-3h-5v2H8v-2H3z'],
    ['#BA9471', 'M16 15h7v8h-7z M20 10h7v3h-7z M10 21h5v3h-5z'],
    [cream, 'M19 16h11v4h-3v2h-7v-2h-1z M18 21h4v3h-4z'],
    [white, 'M21 13h3v3h-3z M27 12h2v3h-2z'],
    [ink, 'M22 14h2v2h-2z M28 13h1v2h-1z M25 17h3v2h-3z M16 17h3v1h-3z M16 19h4v1h-4z M26 20h2v1h-2z'],
    ['#D6A294', 'M20 18h2v1h-2z M28 17h2v1h-2z'],
    ['#557681', 'M16 25h3v2h-3z M24 24h3v1h-3z'],
  ],
};

const butterfly: BattleArt = {
  name: 'Common Mormon',
  archetype: 'butterfly',
  status: 'bespoke',
  layers: [
    [ink, 'M2 5h6v2h5v5h2V7h-2V4h-2V2h2v2h3v3h1V4h3V2h2v2h-2v3h-2v5h2V7h5V5h5v3h2v8h-3v2h1v6h-2v3h-6v-2h-3v-5h-1v6h-3v-6h-1v5h-3v2H5v-3H3v-6h1v-2H1V8h1z'],
    ['#3C4B59', 'M3 7h4v2h5v6h3v4h-4v5H6v-2H4v-4h3v-3H3z M23 9h4V7h3v7h-3v4h2v4h-2v2h-5v-5h-3v-4h3V9z'],
    [cream, 'M4 9h3v3H4z M8 11h3v3H8z M11 15h2v2h-2z M23 11h3v3h-3z M27 9h2v3h-2z M20 15h2v2h-2z M6 20h3v3H6z M23 20h3v3h-3z'],
    ['#BDCEA2', 'M5 15h3v2H5z M9 19h2v3H9z M25 15h3v2h-3z M21 19h2v3h-2z'],
    ['#D88C65', 'M5 24h2v1H5z M10 22h1v2h-1z M26 24h2v1h-2z M21 22h1v2h-1z'],
    ['#78917D', 'M16 10h1v14h-1z'],
    [white, 'M15 11h1v2h-1z M17 11h1v2h-1z'],
  ],
};

const boar: BattleArt = {
  name: 'Wild Boar',
  archetype: 'boar',
  status: 'bespoke',
  layers: [
    [ink, 'M2 16h4v-3h4v-2h8V8h4v2h3V8h4v6h2v9h-4v4h-5v-2h-8v3H9v-5H5v-3H2z'],
    ['#785040', 'M5 16h4v-3h11v-2h3v2h4v-3h1v5h2v7h-4v4h-3v-2h-9v3h-4v-5H6v-3H4v-2h1z'],
    ['#A27B5B', 'M10 14h9v5h-9z M20 14h8v4h-8z'],
    ['#4E3B37', 'M9 12h3v3H9z M14 11h3v4h-3z M19 10h2v5h-2z M7 19h5v4H7z M10 25h3v2h-3z M23 24h3v2h-3z'],
    ['#D18B78', 'M25 17h6v5h-6z M21 11h1v2h-1z M26 11h1v2h-1z'],
    ['#E9AF90', 'M26 17h4v1h-4z'],
    [cream, 'M22 20h2v4h-2v-1h-1v-2h1z M28 22h2v2h-2z'],
    [white, 'M21 16h3v3h-3z'],
    [ink, 'M22 17h2v2h-2z M27 19h1v2h-1z M29 19h1v2h-1z'],
  ],
};

export const BESPOKE_BATTLE_ART: Record<string, BattleArt> = {
  sp_malayan_tiger: tiger,
  sp_asian_elephant: elephant,
  sp_oriental_pied_hornbill: hornbill,
  sp_reticulated_python: python,
  sp_asian_small_clawed_otter: otter,
  sp_common_mormon: butterfly,
  sp_wild_boar: boar,
};

// Morphological Templates for 38 Archetypes on 32x32 pixel grid
// Each archetype has:
// 1. outline: silhouette ink path
// 2. body: primary mass
// 3. tone: secondary shading
// 4. belly: underbelly/chest accent
// 5. eye: white sclera + ink pupil
// 6. feature: signature morphology (tusks/trunk/shell/crest/antlers/horns/snout/wings/tail)
export type MorphologicalTemplate = {
  outline: string;
  body: string;
  tone: string;
  belly: string;
  eyeWhite: string;
  eyePupil: string;
  featureOverlay: string;
};

export const ARCHETYPE_TEMPLATES: Record<string, MorphologicalTemplate> = {
  tapir: {
    outline: 'M2 17h5v-4h5v-3h9v2h3v-2h4v7h2v10h-4v3h-6v-2h-7v2h-6v-4H4v-5H2z',
    body: 'M4 18h6v-3h8v-1h4v7h4v7h-3v2h-5v-2h-8v2h-5v-3H5v-4H4z',
    tone: 'M10 14h8v7h-8z M18 15h4v6h-4z',
    belly: 'M10 14h9v10h-9z', // White torso blanket
    eyeWhite: 'M24 15h3v3h-3z',
    eyePupil: 'M25 16h2v2h-2z',
    featureOverlay: 'M26 19h5v3h-5z M22 10h2v2h-2z', // Proboscis snout + ear rim
  },
  bear: {
    outline: 'M4 14h5V9h4V7h5v2h3v5h5v11h-4v4h-5v-2h-6v2H7v-4H4z',
    body: 'M5 15h5v-5h3V8h4v6h6v10h-3v3h-5v-2h-5v2H8v-4H5z',
    tone: 'M10 13h8v6h-8z M14 19h6v4h-6z',
    belly: 'M13 18h4v3h-4z M12 21h6v2h-6z', // Golden chest crescent
    eyeWhite: 'M19 11h3v3h-3z',
    eyePupil: 'M20 12h2v2h-2z',
    featureOverlay: 'M9 7h2v2H9z M17 7h2v2h-2z M21 16h4v3h-4z', // Round ears + muzzle
  },
  pangolin: {
    outline: 'M1 21h7v-4h5v-3h7v-2h4v3h5v6h-3v4h-6v2h-7v2H7v-3H1z',
    body: 'M3 21h6v-3h5v-2h6v2h4v4h-3v3h-6v2h-6v-2H5v-2H3z',
    tone: 'M9 16h8v4H9z M17 18h4v3h-4z',
    belly: 'M6 22h14v2H6z',
    eyeWhite: 'M23 15h2v2h-2z',
    eyePupil: 'M24 15h1v1h-1z',
    featureOverlay: 'M8 17h2v2H8z M12 16h2v2h-2z M16 15h2v2h-2z M20 17h2v2h-2z M10 20h2v2h-2z M14 19h2v2h-2z M18 19h2v2h-2z', // Keeled scales
  },
  porcupine: {
    outline: 'M2 13h7V9h8v3h5v3h5v10h-4v3h-6v-2h-8v2H5v-4H2z',
    body: 'M4 14h6v-3h6v3h5v8h-3v3h-5v-2h-7v2H6v-3H4z',
    tone: 'M9 12h8v5H9z M16 15h5v5h-5z',
    belly: 'M8 20h10v3H8z',
    eyeWhite: 'M22 15h3v3h-3z',
    eyePupil: 'M23 16h2v2h-2z',
    featureOverlay: 'M3 10h4v2H3z M6 7h4v2H6z M11 6h4v2h-4z M16 7h4v2h-4z M1 14h3v2H1z M2 18h3v2H2z M23 18h3v2h-3z', // Radiating defensive quills
  },
  deer: {
    outline: 'M3 17h4v-5h5V5h4v6h5v4h4v8h-3v7h-3v-7h-5v7h-3v-8H8v7H5v-8H3z',
    body: 'M4 18h4v-4h4V7h2v5h6v4h3v7h-2v7h-2v-7h-5v7h-2v-8H9v7H6v-7H4z',
    tone: 'M10 13h5v6h-5z M14 15h4v5h-4z',
    belly: 'M11 18h6v3h-6z M12 9h2v3h-2z', // Throat chevrons/bib
    eyeWhite: 'M17 8h3v3h-3z',
    eyePupil: 'M18 9h2v2h-2z',
    featureOverlay: 'M12 3h2v3h-2z M15 3h2v3h-2z M10 4h2v1h-2z M17 4h2v1h-2z', // Antlers / horns
  },
  bovine: {
    outline: 'M2 15h6v-5h6V5h3v2h5v4h5v4h3v11h-4v5h-4v-5h-7v5h-4v-6H7v5H3v-6H2z',
    body: 'M3 16h6v-4h5V7h2v2h5v3h4v4h3v9h-3v5h-3v-5h-7v5h-3v-6H8v5H4v-6H3z',
    tone: 'M11 13h9v7h-9z M17 15h6v6h-6z',
    belly: 'M10 21h10v3H10z M21 24h3v4h-3z M6 24h3v4H6z', // White stockings
    eyeWhite: 'M22 12h3v3h-3z',
    eyePupil: 'M23 13h2v2h-2z',
    featureOverlay: 'M13 4h3v2h-3z M21 6h3v2h-3z M11 3h2v2h-2z M24 5h2v2h-2z M23 18h4v3h-4z', // Curved horns + broad muzzle
  },
  feline: {
    outline: 'M2 17h5v-5h5V7h3v2h5V7h3v5h4v9h-3v6h-4v-3h-6v3h-4v-5H6v4H2z',
    body: 'M4 18h4v-4h4V9h2v2h4V9h2v4h3v8h-2v5h-3v-3h-6v3h-3v-5H7v4H4z',
    tone: 'M10 13h8v6h-8z M15 15h5v5h-5z',
    belly: 'M10 19h8v3h-8z',
    eyeWhite: 'M18 11h3v3h-3z',
    eyePupil: 'M19 12h2v2h-2z',
    featureOverlay: 'M11 14h2v3h-2z M15 13h2v3h-2z M19 14h2v3h-2z M7 18h2v2H7z M2 18h2v4H2z', // Whiskers & tail
  },
  civet: {
    outline: 'M1 18h6v-5h6V8h6v3h4v4h6v6h-4v5h-4v-3h-7v3h-4v-4H6v3H1z',
    body: 'M2 19h6v-4h5V9h4v3h4v4h5v5h-3v4h-3v-3h-7v3h-3v-4H7v3H2z',
    tone: 'M9 13h8v5H9z M15 15h5v4h-5z',
    belly: 'M9 18h8v3H9z',
    eyeWhite: 'M18 11h3v3h-3z',
    eyePupil: 'M19 12h2v2h-2z',
    featureOverlay: 'M15 10h5v1h-5z M23 17h4v2h-4z M1 20h3v2H1z', // Mask stripe / ringed tail
  },
  squirrel: {
    outline: 'M3 13h6V6h6v4h4v3h5v8h-3v6h-5v-2h-5v2H8v-4H4v-4H3z',
    body: 'M5 14h5V8h4v3h4v3h4v6h-2v5h-4v-2h-5v2H9v-4H5v-4H5z',
    tone: 'M9 12h7v6H9z M13 14h5v5h-5z',
    belly: 'M10 18h6v4h-6z',
    eyeWhite: 'M16 11h3v3h-3z',
    eyePupil: 'M17 12h2v2h-2z',
    featureOverlay: 'M2 9h5v6H2z M3 6h3v3H3z M18 8h2v2h-2z', // Arched fluffy tail + ear tufts
  },
  glider: {
    outline: 'M2 11h6V6h5v4h6v-2h4v5h4v9h-5v5h-6v-2h-6v2H5v-6H2z',
    body: 'M3 12h5V8h4v3h6v1h3v4h3v7h-4v4h-5v-2h-6v2H6v-6H3z',
    tone: 'M8 13h9v6H8z',
    belly: 'M9 17h7v4H9z',
    eyeWhite: 'M17 10h3v3h-3z',
    eyePupil: 'M18 11h2v2h-2z',
    featureOverlay: 'M1 13h3v8H1z M27 15h3v7h-3z', // Gliding patagium membranes
  },
  colugo: {
    outline: 'M2 10h6V6h6v3h5v4h6v9h-5v6h-7v-2h-6v2H4v-7H2z',
    body: 'M4 11h5V8h4v2h5v4h5v7h-4v5h-6v-2h-6v2H5v-6H4z',
    tone: 'M9 12h8v7H9z',
    belly: 'M9 18h7v3H9z',
    eyeWhite: 'M16 9h4v4h-4z', // Large nocturnal eyes
    eyePupil: 'M17 10h2v2h-2z',
    featureOverlay: 'M1 12h4v9H1z M26 14h4v7h-4z M7 14h2v2H7z M12 13h2v2h-2z M17 15h2v2h-2z', // Mottled camouflage spots
  },
  bat: {
    outline: 'M2 7h5v4h5V4h4v4h5V7h5v7h-3v7h-5v4h-5v-2h-4v2H6v-5H2z',
    body: 'M4 9h4v3h4V6h2v3h4v1h4v5h-2v6h-4v3h-4v-2h-4v2H7v-4H4z',
    tone: 'M10 12h6v6h-6z',
    belly: 'M10 16h6v3h-6z',
    eyeWhite: 'M14 8h2v2h-2z M18 8h2v2h-2z',
    eyePupil: 'M15 9h1v1h-1z M19 9h1v1h-1z',
    featureOverlay: 'M1 9h3v8H1z M27 9h3v8h-3z M11 4h2v2h-2z M17 4h2v2h-2z', // Wings and pointed ears
  },
  monkey: {
    outline: 'M3 15h5v-6h6V4h5v5h4v5h4v8h-4v5h-4v-3h-6v3H7v-5H3z',
    body: 'M5 16h4v-5h4V6h4v4h3v5h3v6h-3v5h-3v-3h-6v3H8v-5H5z',
    tone: 'M10 12h6v6h-6z',
    belly: 'M10 17h6v4h-6z',
    eyeWhite: 'M16 8h3v3h-3z',
    eyePupil: 'M17 9h2v2h-2z',
    featureOverlay: 'M19 12h3v4h-3z M1 18h3v3H1z', // Muzzle/nose + tail curl
  },
  gibbon: {
    outline: 'M2 13h4V7h5V3h5v4h4v5h5v7h-4v9h-3v-6h-4v6h-3v-8H7v6H3z',
    body: 'M3 14h3V8h4V5h4v3h3v5h4v5h-3v8h-2v-6h-4v6h-2v-7H8v6H5v-7H3z',
    tone: 'M9 11h6v6H9z',
    belly: 'M9 15h5v3H9z',
    eyeWhite: 'M13 7h3v3h-3z',
    eyePupil: 'M14 8h2v2h-2z',
    featureOverlay: 'M11 6h7v5h-7z M12 7h5v3h-5z M2 18h2v7H2z M25 17h2v8h-2z', // White face mask + long brachiation arms
  },
  orangutan: {
    outline: 'M3 12h5V6h9v5h6v7h3v8h-4v4h-6v-2h-6v2H5v-5H3z',
    body: 'M4 13h5V8h7v4h5v6h2v6h-3v4h-5v-2h-6v2H6v-4H4z',
    tone: 'M8 12h10v7H8z M12 17h8v5h-8z',
    belly: 'M9 18h8v4H9z',
    eyeWhite: 'M14 9h3v3h-3z',
    eyePupil: 'M15 10h2v2h-2z',
    featureOverlay: 'M8 10h2v4H8z M19 10h2v4h-2z M12 13h5v3h-5z', // Cheek flanges + broad mouth
  },
  rodent: {
    outline: 'M2 18h6v-5h5V9h5v3h4v4h6v5h-4v4h-5v-2h-6v2H7v-4H2z',
    body: 'M4 19h5v-4h4v-3h4v3h3v4h5v3h-3v4h-5v-2h-5v2H8v-4H4z',
    tone: 'M9 14h7v5H9z',
    belly: 'M9 18h7v3H9z',
    eyeWhite: 'M17 11h3v3h-3z',
    eyePupil: 'M18 12h2v2h-2z',
    featureOverlay: 'M1 21h4v1H1z M22 17h4v2h-4z', // Long tail + incisors/whiskers
  },
  shrew: {
    outline: 'M2 19h6v-4h5v-3h5v2h3v3h6v4h-4v4h-5v-2h-6v2H7v-4H2z',
    body: 'M3 20h6v-4h4v-2h4v2h3v3h5v2h-3v4h-5v-2h-5v2H8v-4H3z',
    tone: 'M9 15h6v4H9z',
    belly: 'M9 19h6v2H9z',
    eyeWhite: 'M16 13h2v2h-2z',
    eyePupil: 'M17 14h1v1h-1z',
    featureOverlay: 'M23 16h6v2h-6z M1 20h3v2H1z', // Long pointed snout
  },
  mole: {
    outline: 'M4 18h5v-5h6V9h6v4h5v5h4v5h-4v3h-7v-1h-6v1H8v-4H4z',
    body: 'M5 19h5v-4h5v-3h4v3h4v4h3v3h-3v3h-6v-1h-5v1H9v-3H5z',
    tone: 'M10 14h7v6h-7z',
    belly: 'M10 19h7v2h-7z',
    eyeWhite: 'M18 12h1v1h-1z',
    eyePupil: 'M18 12h1v1h-1z',
    featureOverlay: 'M23 18h6v4h-6z M2 18h5v4H2z', // Broad shovel spade forefeet
  },
  otter: {
    outline: 'M1 20h6v-4h5v-5h5V7h4v4h4v5h4v5h-4v4h-6v2h-6v-2H7v-3H1z',
    body: 'M3 20h5v-3h4v-4h4V9h3v3h3v4h4v4h-3v4h-5v2h-5v-2H8v-3H3z',
    tone: 'M9 14h7v5H9z',
    belly: 'M9 18h7v3H9z',
    eyeWhite: 'M18 10h3v3h-3z',
    eyePupil: 'M19 11h2v2h-2z',
    featureOverlay: 'M16 13h7v3h-7z M1 22h4v2H1z', // Pale bib + streamlined tail
  },
  mongoose: {
    outline: 'M2 19h6v-5h5V9h5v3h4v3h6v5h-4v4h-5v-2h-6v2H7v-4H2z',
    body: 'M3 20h6v-4h4v-4h4v3h4v3h5v3h-3v4h-5v-2h-5v2H8v-4H3z',
    tone: 'M9 13h7v5H9z',
    belly: 'M9 18h7v3H9z',
    eyeWhite: 'M17 11h3v3h-3z',
    eyePupil: 'M18 12h2v2h-2z',
    featureOverlay: 'M1 21h4v2H1z M14 11h4v2h-4z', // Sharp snout + alert stance
  },
  hornbill: {
    outline: 'M4 17h5v-5h5V6h5V3h6v4h4v4h-6v6h-4v5h-5v4h-4v-4H8v-3H4z',
    body: 'M6 18h4v-4h4V8h4V5h4v3h2v3h-4v5h-3v5h-4v3h-3v-4H9v-3H6z',
    tone: 'M11 13h7v6h-7z',
    belly: 'M11 18h6v4h-6z',
    eyeWhite: 'M18 8h3v3h-3z',
    eyePupil: 'M19 9h2v2h-2z',
    featureOverlay: 'M21 4h7v4h-7z M23 8h6v3h-6z', // Prominent casqued bill
  },
  owl: {
    outline: 'M6 12h4V7h4v4h4V7h4v5h3v11h-4v4h-6v-2h-4v2H8v-4H6z',
    body: 'M7 13h3V9h3v3h3V9h3v4h3v9h-3v4h-5v-2h-3v2H9v-4H7z',
    tone: 'M9 14h9v6H9z',
    belly: 'M10 18h8v5h-8z', // Barred chest
    eyeWhite: 'M9 11h4v4H9z M16 11h4v4h-4z', // Large front-facing eyes
    eyePupil: 'M10 12h2v2h-2z M17 12h2v2h-2z',
    featureOverlay: 'M7 6h3v3H7z M19 6h3v3h-3z M14 15h2v3h-2z', // Ear tufts & raptor beak
  },
  raptor: {
    outline: 'M4 16h6v-5h5V5h5v3h4v4h3v4h-5v4h-4v4h-4v3h-4v-3H8v-4H4z',
    body: 'M6 17h5v-4h4V7h4v2h3v3h2v3h-4v4h-3v4h-3v3h-3v-3H9v-4H6z',
    tone: 'M11 12h6v6h-6z',
    belly: 'M11 17h6v4h-6z',
    eyeWhite: 'M17 8h3v3h-3z',
    eyePupil: 'M18 9h2v2h-2z',
    featureOverlay: 'M22 10h4v4h-4z M13 4h3v3h-3z', // Hooked raptorial beak + crest
  },
  woodpecker: {
    outline: 'M5 18h5v-5h5V6h5v4h5v3h3v2h-6v4h-4v5h-3v4h-4v-4H9v-4H5z',
    body: 'M7 19h4v-4h4V8h3v3h4v2h1v1h-5v4h-3v5h-3v3h-3v-4h-2v-4H7z',
    tone: 'M11 13h6v6h-6z',
    belly: 'M11 18h5v4h-5z',
    eyeWhite: 'M16 9h3v3h-3z',
    eyePupil: 'M17 10h2v2h-2z',
    featureOverlay: 'M22 11h7v2h-7z M14 4h4v3h-4z', // Chisel bill + erect crimson crest
  },
  pitta: {
    outline: 'M6 17h5v-5h5V7h6v5h4v5h-3v5h-4v3h-5v-1h-4v-3H8v-4H6z',
    body: 'M8 18h4v-4h4V9h4v4h3v4h-2v5h-3v3h-4v-1h-3v-3H9v-4H8z',
    tone: 'M11 13h6v5h-6z',
    belly: 'M11 17h6v4h-6z',
    eyeWhite: 'M17 9h3v3h-3z',
    eyePupil: 'M18 10h2v2h-2z',
    featureOverlay: 'M21 11h5v3h-5z M14 8h6v2h-6z', // Stout bill + supercilium eyebrow
  },
  pheasant: {
    outline: 'M2 19h7v-5h5V6h5v4h5v4h-3v5h-4v4h-4v3h-4v-2H7v-4H2z',
    body: 'M4 19h6v-4h4V8h4v3h4v3h-2v5h-3v4h-3v3h-3v-2H8v-4H4z',
    tone: 'M10 13h7v6h-7z',
    belly: 'M10 18h6v4h-6z',
    eyeWhite: 'M17 9h3v3h-3z',
    eyePupil: 'M18 10h2v2h-2z',
    featureOverlay: 'M1 21h6v2H1z M14 5h4v2h-4z M21 11h4v3h-4z', // Sweeping tail feathers + crest
  },
  partridge: {
    outline: 'M5 16h6v-5h5V7h5v4h4v5h-3v5h-5v3h-5v-2H9v-4H5z',
    body: 'M7 17h5v-4h4V9h3v3h3v4h-2v5h-4v3h-4v-2h-3v-4H7z',
    tone: 'M11 13h6v5h-6z',
    belly: 'M11 17h6v3h-6z',
    eyeWhite: 'M17 9h3v3h-3z',
    eyePupil: 'M18 10h2v2h-2z',
    featureOverlay: 'M21 11h4v3h-4z M13 6h4v2h-4z', // Short beak + crest comb
  },
  dove: {
    outline: 'M5 17h6v-5h5V7h5v4h4v4h-3v5h-5v4h-5v-3H9v-4H5z',
    body: 'M7 18h5v-4h4V9h3v3h3v3h-2v5h-4v4h-4v-3h-3v-4H7z',
    tone: 'M11 13h6v5h-6z',
    belly: 'M11 17h6v4h-6z',
    eyeWhite: 'M17 9h3v3h-3z',
    eyePupil: 'M18 10h2v2h-2z',
    featureOverlay: 'M21 11h4v2h-4z M11 14h5v3h-5z', // Gentle bill + wing sheen
  },
  waterbird: {
    outline: 'M5 17h5v-6h4V5h4v4h3v3h5v2h-5v4h-4v6h-3v4h-3v-4H8v-4H5z',
    body: 'M7 18h4v-5h3V7h2v3h2v2h4v1h-4v4h-3v6h-2v4h-2v-4H9v-4H7z',
    tone: 'M10 13h5v6h-5z',
    belly: 'M10 18h5v4h-5z',
    eyeWhite: 'M16 8h3v3h-3z',
    eyePupil: 'M17 9h2v2h-2z',
    featureOverlay: 'M19 10h8v2h-8z M12 25h5v1h-5z', // Long spear dagger bill + long legs
  },
  songbird: {
    outline: 'M4 17h6v-5h5V7h5v4h4v4h-4v5h-4v4h-4v-3H8v-4H4z',
    body: 'M6 18h5v-4h4V9h3v3h3v3h-3v5h-3v4h-3v-3H9v-4H6z',
    tone: 'M10 13h6v5h-6z',
    belly: 'M10 17h6v3h-6z',
    eyeWhite: 'M16 9h3v3h-3z',
    eyePupil: 'M17 10h2v2h-2z',
    featureOverlay: 'M20 11h5v2h-5z M2 18h3v2H2z', // Slender bill + graduated tail
  },
  crocodile: {
    outline: 'M2 19h7v-4h7v-2h7v2h5v4h-4v4h-7v-1h-7v2H6v-3H2z',
    body: 'M3 20h6v-3h7v-2h6v2h4v3h-3v4h-6v-1h-7v2H7v-3H3z',
    tone: 'M10 16h8v3h-8z M18 17h4v2h-4z',
    belly: 'M8 21h12v2H8z',
    eyeWhite: 'M21 14h3v2h-3z',
    eyePupil: 'M22 14h2v1h-2z',
    featureOverlay: 'M24 18h7v3h-7z M9 14h2v2H9z M13 13h2v2h-2z M17 14h2v2h-2z', // Toothed jaw + dorsal scutes
  },
  turtle: {
    outline: 'M3 19h5v-5h6V9h7v4h4v5h3v4h-4v3h-6v-1h-6v2H7v-4H3z',
    body: 'M5 20h4v-4h5v-4h5v4h3v4h2v3h-3v3h-5v-1h-5v2H8v-4H5z',
    tone: 'M9 13h7v6H9z',
    belly: 'M9 18h7v3H9z',
    eyeWhite: 'M22 15h3v3h-3z',
    eyePupil: 'M23 16h2v2h-2z',
    featureOverlay: 'M2 18h4v3H2z M24 20h5v2h-5z M10 12h2v2h-2z M14 11h2v2h-2z M12 15h2v2h-2z', // Flippers + carapace scutes
  },
  monitor: {
    outline: 'M2 20h7v-4h6v-3h6v2h4v3h5v4h-5v3h-7v-1h-6v2H6v-4H2z',
    body: 'M4 21h6v-3h5v-2h5v2h3v3h4v3h-4v3h-6v-1h-6v2H7v-4H4z',
    tone: 'M10 16h7v3h-7z',
    belly: 'M8 22h10v2H8z',
    eyeWhite: 'M20 15h3v2h-3z',
    eyePupil: 'M21 15h2v1h-2z',
    featureOverlay: 'M25 18h6v2h-6z M1 22h4v2H1z M11 17h2v1h-2z M15 16h2v1h-2z', // Forked tongue + ocelli bands
  },
  skink: {
    outline: 'M2 21h6v-3h6v-2h6v2h4v3h5v3h-4v3h-7v-1h-6v2H7v-4H2z',
    body: 'M4 22h5v-2h5v-2h5v2h3v3h4v2h-3v3h-6v-1h-6v2H8v-4H4z',
    tone: 'M9 18h7v2H9z',
    belly: 'M8 23h9v2H8z',
    eyeWhite: 'M20 17h2v2h-2z',
    eyePupil: 'M21 17h1v1h-1z',
    featureOverlay: 'M24 19h5v2h-5z M1 22h4v2H1z', // Slender bronze body + smooth tail
  },
  python: {
    outline: 'M4 19h8v-4h6v-5h-2V6h4V4h7v2h3v7h-5v3h2v4h2v6h-3v2H4v-2H1v-4h3z',
    body: 'M4 21h10v-5h5v-5h-1V7h3V5h5v2h3v5h-5v6h2v3h2v4h-4v2H5v-2H2v-2h2z',
    tone: 'M20 7h7v4h-7z M16 17h3v5h5v2H10v-2h6z M4 23h4v2H4z',
    belly: 'M22 10h7v2h-7z',
    eyeWhite: 'M24 7h3v3h-3z',
    eyePupil: 'M25 8h2v2h-2z',
    featureOverlay: 'M6 21h3v2H6z M11 24h3v2h-3z M16 22h3v2h-3z M24 22h3v2h-3z M20 16h3v2h-3z', // Reticulations
  },
  butterfly: {
    outline: 'M2 5h6v2h5v5h2V7h-2V4h-2V2h2v2h3v3h1V4h3V2h2v2h-2v3h-2v5h2V7h5V5h5v3h2v8h-3v2h1v6h-2v3h-6v-2h-3v-5h-1v6h-3v-6h-1v5h-3v2H5v-3H3v-6h1v-2H1V8h1z',
    body: 'M3 7h4v2h5v6h3v4h-4v5H6v-2H4v-4h3v-3H3z M23 9h4V7h3v7h-3v4h2v4h-2v2h-5v-5h-3v-4h3V9z',
    tone: 'M5 15h3v2H5z M9 19h2v3H9z M25 15h3v2h-3z M21 19h2v3h-2z',
    belly: 'M4 9h3v3H4z M8 11h3v3H8z M11 15h2v2h-2z M23 11h3v3h-3z M27 9h2v3h-2z M20 15h2v2h-2z',
    eyeWhite: 'M15 11h1v2h-1z M17 11h1v2h-1z',
    eyePupil: 'M15 11h1v1h-1z M17 11h1v1h-1z',
    featureOverlay: 'M16 10h1v14h-1z M5 24h2v1H5z M26 24h2v1h-2z', // Thorax + swallowtail tails
  },
  elephant: {
    outline: 'M3 14h5V8h5V5h11v2h4v5h3v12h-2v3h-5v-5h-3v6h-5v-3h-5v3H6v-6H3z',
    body: 'M5 15h15v8h-2v4h-2v-3h-6v3H7v-6H5z M13 7h10v2h4v5h3v10h-2v2h-3v-9H13z',
    tone: 'M14 6h9v3h3v6H14z M7 15h8v4H7z M27 16h2v8h-2z',
    belly: 'M10 10h8v11h-6v-2h-2z',
    eyeWhite: 'M21 13h3v4h-3z',
    eyePupil: 'M22 14h2v3h-2z',
    featureOverlay: 'M23 18h2v4h-2z M20 19h2v2h-2z', // Tusks
  },
  boar: {
    outline: 'M2 16h4v-3h4v-2h8V8h4v2h3V8h4v6h2v9h-4v4h-5v-2h-8v3H9v-5H5v-3H2z',
    body: 'M5 16h4v-3h11v-2h3v2h4v-3h1v5h2v7h-4v4h-3v-2h-9v3h-4v-5H6v-3H4v-2h1z',
    tone: 'M10 14h9v5h-9z M20 14h8v4h-8z',
    belly: 'M9 12h3v3H9z M14 11h3v4h-3z M7 19h5v4H7z',
    eyeWhite: 'M21 16h3v3h-3z',
    eyePupil: 'M22 17h2v2h-2z',
    featureOverlay: 'M22 20h2v4h-2v-1h-1v-2h1z M28 22h2v2h-2z', // Exposed ivory tusks
  },
};

// Explicit fallback for truly unknown species IDs
export const UNAVAILABLE_BATTLE_ART: BattleArt = {
  name: 'Art Unavailable',
  archetype: 'unknown',
  status: 'unavailable',
  layers: [
    [ink, 'M8 6h16v20H8z'],
    ['#4A5568', 'M10 8h12v16H10z'],
    ['#CBD5E1', 'M13 10h6v3h-3v3h3v2h-3v-1h-3v-4h3v-1h-3z M14 20h2v2h-2z'], // Bold question mark silhouette
  ],
};

// 10 Distinct Role Cues (ground aura / badge) - External to combatant anatomy
export type RoleCue = {
  name: string;
  badgeColor: string;
  auraColor: string;
  iconPath: string;
};

export const ROLE_CUES: Record<string, RoleCue> = {
  Power: {
    name: 'Power',
    badgeColor: '#D9483B',
    auraColor: 'rgba(217, 72, 59, 0.35)',
    iconPath: 'M14 2l4 10h-4l3 10-7-12h4z', // Lightning bolt
  },
  Tank: {
    name: 'Tank',
    badgeColor: '#5C7080',
    auraColor: 'rgba(92, 112, 128, 0.35)',
    iconPath: 'M12 4l8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V7l8-3z', // Heavy shield
  },
  Agile: {
    name: 'Agile',
    badgeColor: '#48BB78',
    auraColor: 'rgba(72, 187, 120, 0.35)',
    iconPath: 'M4 14l8-8 8 8-4 4-4-4-4 4z', // Wing / chevron
  },
  Defense: {
    name: 'Defense',
    badgeColor: '#319795',
    auraColor: 'rgba(49, 151, 149, 0.35)',
    iconPath: 'M6 8h12v12H6z M9 11h6v6H9z', // Fortified bulwark
  },
  Guardian: {
    name: 'Guardian',
    badgeColor: '#ED8936',
    auraColor: 'rgba(237, 137, 54, 0.35)',
    iconPath: 'M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z', // Guardian star
  },
  Precision: {
    name: 'Precision',
    badgeColor: '#9F7AEA',
    auraColor: 'rgba(159, 122, 234, 0.35)',
    iconPath: 'M12 2v4m0 12v4M2 12h4m12 0h4m-10-6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z', // Crosshair target
  },
  Trickster: {
    name: 'Trickster',
    badgeColor: '#ED64A6',
    auraColor: 'rgba(237, 100, 166, 0.35)',
    iconPath: 'M12 3l2 5h5l-4 4 2 6-5-3-5 3 2-6-4-4h5z', // Spark diamond
  },
  Support: {
    name: 'Support',
    badgeColor: '#4299E1',
    auraColor: 'rgba(66, 153, 225, 0.35)',
    iconPath: 'M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z', // Healing cross
  },
  Control: {
    name: 'Control',
    badgeColor: '#805AD5',
    auraColor: 'rgba(128, 90, 213, 0.35)',
    iconPath: 'M6 12a6 6 0 1 1 12 0 6 6 0 0 1-12 0z M10 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0z', // Concentric vortex
  },
  Balanced: {
    name: 'Balanced',
    badgeColor: '#ECC94B',
    auraColor: 'rgba(236, 201, 75, 0.35)',
    iconPath: 'M12 4l7 14H5z', // Balanced delta
  },
};

// 4 Category Markers
export const CATEGORY_MARKERS: Record<string, { label: string; color: string }> = {
  Mammal: { label: 'Mammal', color: '#B7791F' },
  Bird: { label: 'Bird', color: '#3182CE' },
  Reptile: { label: 'Reptile', color: '#38A169' },
  Butterfly: { label: 'Butterfly', color: '#D53F8C' },
};

// SVG coordinate paths for explicit feature tokens on 32x32 pixel grid
export const FEATURE_OVERLAY_PATHS = {
  hornbill_casque: 'M21 3h7v4h-7z M20 6h8v2h-8z',
  elephant_trunk: 'M27 15h3v9h-2v2h-3v-3h2v-8z',
  elephant_tusks: 'M23 18h2v4h-2z M20 19h2v2h-2z',
  pangolin_scales: 'M8 17h2v2H8z M12 16h2v2h-2z M16 15h2v2h-2z M20 17h2v2h-2z M10 20h2v2h-2z M14 19h2v2h-2z',
  porcupine_quills: 'M3 10h4v2H3z M6 7h4v2H6z M11 6h4v2h-4z M16 7h4v2h-4z M1 14h3v2H1z M2 18h3v2H2z',
  antlers: 'M12 3h2v3h-2z M15 3h2v3h-2z M10 4h2v1h-2z M17 4h2v1h-2z',
  canine_tusks: 'M22 19h2v4h-2z M27 20h2v3h-2z',
  longtail: 'M1 18h4v2H1z M1 20h2v4H1z',
  shorttail: 'M2 18h3v2H2z',
  stripes: 'M8 14h2v6H8z M12 13h2v7h-2z M16 14h2v6h-2z M20 15h2v5h-2z',
  whiteface: 'M15 8h6v5h-6z M16 13h4v3h-4z',
  whiterump: 'M4 16h5v4H4z',
  whitethroat: 'M12 14h6v4h-6z',
  yellow_belly: 'M9 18h9v4H9z',
  redcrest: 'M13 3h5v4h-5z M11 5h3v2h-3z',
  raptor_crest: 'M12 4h4v3h-4z M15 3h2v2h-2z',
  longbeak: 'M20 10h8v2h-8z',
  curvedbeak: 'M21 11h6v2h-2v2h-2v-2h-2z',
  webbedpaws: 'M5 24h5v2H5z M19 24h5v2h-5z',
  shell: 'M7 13h12v7H7z M10 11h6v2h-6z',
  scutes: 'M9 13h2v2H9z M13 12h2v2h-2z M17 13h2v2h-2z M21 14h2v2h-2z',
  monitor_tongue: 'M25 18h6v1h-3v1h-1v-1h-2z M28 20h3v1h-3z',
  owl_facial_disc: 'M8 9h5v6H8z M15 9h5v6h-5z',
  butterfly_wings: 'M4 9h3v3H4z M8 11h3v3H8z M23 11h3v3h-3z M27 9h2v3h-2z M5 24h2v2H5z M25 24h2v2h-2z',
} as const;

/**
 * Generate conservative feature overlay layers based on metadata feature tokens
 * Limits to 1-4 feature paths rendered after template features and before eyes.
 */
export function generateFeatureLayers(meta: SpeciesArtMetadata): PixelLayer[] {
  const tokens = [
    ...(meta.features || []),
    meta.markings || '',
    meta.ear_variant || '',
    meta.tail_variant || '',
    meta.beak_variant || '',
  ]
    .join(' ')
    .toLowerCase();

  const pal = meta.palette;
  const layers: PixelLayer[] = [];

  const addLayer = (color: string, path: string) => {
    if (layers.length < 4 && !layers.some((l) => l[1] === path)) {
      layers.push([color, path]);
    }
  };

  // 1. hornbill casque
  if (tokens.includes('casque')) {
    addLayer(pal.accent, FEATURE_OVERLAY_PATHS.hornbill_casque);
  }

  // 2. elephant trunk / tusks
  if (tokens.includes('trunk')) {
    addLayer(pal.secondary, FEATURE_OVERLAY_PATHS.elephant_trunk);
  }
  if (tokens.includes('tusk') && tokens.includes('trunk')) {
    addLayer('#FFFDF0', FEATURE_OVERLAY_PATHS.elephant_tusks);
  }

  // 3. pangolin scales
  if (tokens.includes('scale') || tokens.includes('scaly')) {
    addLayer(pal.accent, FEATURE_OVERLAY_PATHS.pangolin_scales);
  }

  // 4. porcupine quills
  if (tokens.includes('quill') || tokens.includes('spine')) {
    addLayer(pal.accent, FEATURE_OVERLAY_PATHS.porcupine_quills);
  }

  // 5. deer antlers / canine tusks
  if (tokens.includes('antler') || tokens.includes('horn')) {
    addLayer(pal.accent, FEATURE_OVERLAY_PATHS.antlers);
  } else if (
    (tokens.includes('tusk') || tokens.includes('tushe') || tokens.includes('canine')) &&
    !tokens.includes('trunk')
  ) {
    addLayer('#FFFDF0', FEATURE_OVERLAY_PATHS.canine_tusks);
  }

  // 6. longtail / shorttail
  const longTailTokens = ['long_sinuous', 'long_slender', 'long_whip', 'very_long', 'long_tail', 'balancing_tail'];
  const shortTailTokens = ['stump', 'stub', 'short_tail', 'short_stout', 'short_bushy', 'tailless'];
  if (longTailTokens.some((t) => tokens.includes(t))) {
    addLayer(pal.secondary, FEATURE_OVERLAY_PATHS.longtail);
  } else if (shortTailTokens.some((t) => tokens.includes(t))) {
    addLayer(pal.secondary, FEATURE_OVERLAY_PATHS.shorttail);
  }

  // 7. stripes
  const stripeTokens = ['stripe', 'tiger_stripes', 'bars', 'zebra', 'banded', 'reticulated'];
  if (stripeTokens.some((t) => tokens.includes(t))) {
    addLayer('#23333D', FEATURE_OVERLAY_PATHS.stripes);
  }

  // 8. whiteface / rump / throat
  const whitefaceTokens = ['white_face', 'white_head', 'spectacle', 'white_front', 'white_mask', 'white_facial'];
  if (whitefaceTokens.some((t) => tokens.includes(t))) {
    addLayer('#FFFDF0', FEATURE_OVERLAY_PATHS.whiteface);
  }
  const rumpTokens = ['white_rump', 'pure_white_rump', 'pale_rump'];
  if (rumpTokens.some((t) => tokens.includes(t))) {
    addLayer('#FFFDF0', FEATURE_OVERLAY_PATHS.whiterump);
  }
  const throatTokens = ['white_throat', 'throat_bib', 'throat_chevron', 'pale_throat', 'white_chest'];
  if (throatTokens.some((t) => tokens.includes(t))) {
    addLayer('#FFFDF0', FEATURE_OVERLAY_PATHS.whitethroat);
  }

  // 9. yellow_belly
  const yellowBellyTokens = ['yellow_belly', 'yellow_vent', 'bright_yellow_vent_and_belly', 'lemon_yellow'];
  if (yellowBellyTokens.some((t) => tokens.includes(t))) {
    addLayer('#F6E05E', FEATURE_OVERLAY_PATHS.yellow_belly);
  }

  // 10. redcrest
  const redCrestTokens = [
    'crimson_crest',
    'red_crest',
    'fan_crest',
    'tall_crimson',
    'scarlet_crest',
    'erect_crest',
    'peaked_crest',
    'black_crowned_crest',
  ];
  if (redCrestTokens.some((t) => tokens.includes(t))) {
    addLayer(pal.accent, FEATURE_OVERLAY_PATHS.redcrest);
  }

  // 11. raptor crest
  if (meta.archetype === 'raptor' || (tokens.includes('raptor') && tokens.includes('crest'))) {
    addLayer(pal.accent, FEATURE_OVERLAY_PATHS.raptor_crest);
  }

  // 12. longbeak
  const longBeakTokens = ['spear_dagger', 'spearing_bill', 'chisel', 'straight_chisel', 'long_narrow_rostrum', 'longbeak'];
  if (longBeakTokens.some((t) => tokens.includes(t))) {
    addLayer(pal.accent, FEATURE_OVERLAY_PATHS.longbeak);
  }

  // 13. curvedbeak
  const curvedBeakTokens = [
    'curved_gamefowl',
    'downcurved',
    'hooked_raptor',
    'raptor_hook',
    'curved_bill',
    'slender_raptorial',
  ];
  if (curvedBeakTokens.some((t) => tokens.includes(t))) {
    addLayer(pal.accent, FEATURE_OVERLAY_PATHS.curvedbeak);
  }

  // 14. webbedpaws
  const webbedTokens = ['webbed', 'paddle', 'flippers'];
  if (webbedTokens.some((t) => tokens.includes(t))) {
    addLayer(pal.secondary, FEATURE_OVERLAY_PATHS.webbedpaws);
  }

  // 15. shell
  if (tokens.includes('shell') || tokens.includes('carapace')) {
    addLayer(pal.accent, FEATURE_OVERLAY_PATHS.shell);
  }

  // 16. scutes
  if (tokens.includes('scute') || tokens.includes('tubercles') || tokens.includes('dorsal_scutes')) {
    addLayer(pal.accent, FEATURE_OVERLAY_PATHS.scutes);
  }

  // 17. monitor tongue
  if (tokens.includes('tongue') || tokens.includes('forked_sensory_tongue') || tokens.includes('snake_tongue')) {
    addLayer('#E53E3E', FEATURE_OVERLAY_PATHS.monitor_tongue);
  }

  // 18. owl facial disc
  if (meta.archetype === 'owl' || tokens.includes('facial_disc')) {
    addLayer(pal.underbelly, FEATURE_OVERLAY_PATHS.owl_facial_disc);
  }

  // 19. butterfly wing patterns
  if (meta.archetype === 'butterfly' || (meta.markings && meta.markings.includes('wing'))) {
    addLayer(pal.accent, FEATURE_OVERLAY_PATHS.butterfly_wings);
  }

  // Return at most 4 feature paths
  return layers.slice(0, 4);
}

/**
 * Compose battle art dynamically for any catalogued species
 */
export function getBattleArt(speciesId: string): BattleArt {
  // 1. Check bespoke
  if (BESPOKE_BATTLE_ART[speciesId]) {
    return BESPOKE_BATTLE_ART[speciesId];
  }

  // 2. Check metadata
  const meta = SPECIES_BATTLE_ART_CATALOGUE[speciesId];
  if (!meta) {
    return UNAVAILABLE_BATTLE_ART;
  }

  // 3. Compose from archetype template and biology palette
  const tpl = ARCHETYPE_TEMPLATES[meta.archetype] || ARCHETYPE_TEMPLATES.rodent;
  const featureLayers = generateFeatureLayers(meta);

  // Render order:
  // outline -> body -> tone -> belly -> template feature -> metadata feature layers (1-4) -> eyeWhite -> eyePupil
  const layers: PixelLayer[] = [
    [ink, tpl.outline],
    [meta.palette.primary, tpl.body],
    [meta.palette.secondary, tpl.tone],
    [meta.palette.underbelly, tpl.belly],
    [meta.palette.accent, tpl.featureOverlay],
    ...featureLayers,
    [white, tpl.eyeWhite],
    [ink, tpl.eyePupil],
  ];

  return {
    name: meta.name,
    archetype: meta.archetype,
    status: 'composed',
    layers,
  };
}

export const hasBattleArt = (speciesId: string): boolean => {
  return Boolean(BESPOKE_BATTLE_ART[speciesId] || SPECIES_BATTLE_ART_CATALOGUE[speciesId]);
};

// Legacy compatibility object
export const BATTLE_ART: Record<string, BattleArt> = new Proxy(
  { ...BESPOKE_BATTLE_ART },
  {
    get(target, prop: string) {
      if (typeof prop !== 'string') return undefined;
      return getBattleArt(prop);
    },
    has(target, prop: string) {
      return hasBattleArt(prop);
    },
  }
);

// Backward compatibility export - explicit fallback
export const GENERIC_BATTLE_ART: BattleArt = UNAVAILABLE_BATTLE_ART;
