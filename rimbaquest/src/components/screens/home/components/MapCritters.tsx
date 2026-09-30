import React from "react";
import { WanderingSprite } from "./WanderingSprite";

// Animals roaming the home map. "ground" animals walk around the menus and are
// drawn under them; "air" animals fly anywhere and are drawn above them.
export function MapCritters({ layer }: { layer: "ground" | "air" }) {
  if (layer === "air") {
    return (
      <>
        <WanderingSprite
          source={require("../../../../../assets/sprites/butterfly_strip.png")}
          frameWidth={66}
          frameHeight={72}
          height={30}
          flying
          speed={34}
          stride={19}
        />
        <WanderingSprite
          source={require("../../../../../assets/sprites/hornbill_strip.png")}
          frameWidth={122}
          frameHeight={100}
          height={46}
          flying
          speed={46}
          stride={37}
        />
      </>
    );
  }

  return (
    <>
      <WanderingSprite
        source={require("../../../../../assets/sprites/tiger_strip.png")}
        frameWidth={114}
        frameHeight={128}
        height={48}
      />
      <WanderingSprite
        source={require("../../../../../assets/sprites/bear_strip.png")}
        frameWidth={82}
        frameHeight={120}
        height={44}
        speed={22}
        stride={18}
      />
      <WanderingSprite
        source={require("../../../../../assets/sprites/elephant_strip.png")}
        frameWidth={144}
        frameHeight={120}
        height={48}
        speed={20}
        stride={20}
      />
      <WanderingSprite
        source={require("../../../../../assets/sprites/tapir_strip.png")}
        frameWidth={139}
        frameHeight={104}
        height={40}
        speed={24}
        stride={21}
      />
    </>
  );
}
