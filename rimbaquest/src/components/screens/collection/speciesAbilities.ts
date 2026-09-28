import { Species } from "../../../types";

export type SpeciesAbility = {
  slot: number;
  name: string;
  description?: string;
};

export function speciesAbilities(item: Species): SpeciesAbility[] {
  const wildlifeAbilities = item.wildlife_abilities ?? [];
  if (wildlifeAbilities.length === 3) {
    return wildlifeAbilities.map(({ slot, name, description }) => ({ slot, name, description }));
  }

  const structured = item.abilities ?? [];
  return [
    ...([1, 2] as const).map((slot) => {
      const ability = structured.find((entry) => entry.slot === slot);
      return {
        slot,
        name: ability?.name || item[`ability_${slot}`] || `Ability ${slot}`,
        description: ability?.description?.replace(/Energy/g, "HP"),
      };
    }),
    {
      slot: 3,
      name: item.passive?.name || item.ability_3 || "Wild Instinct",
      description: "A species-inspired special move you choose during battle.",
    },
  ];
}
