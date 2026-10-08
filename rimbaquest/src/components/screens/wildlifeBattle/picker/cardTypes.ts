import { Species } from "../../../../types";
import { WildlifeCardOption } from "../../../../types/wildlifeMatch";

export type Tab = "ready" | "resting";

export type Card = { species: Species; option: WildlifeCardOption };
