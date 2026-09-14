import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "../../../common/PrimaryButton";
import { Tap } from "../../../common/Tap";
import { useBattleStore } from "../../../../store/useBattleStore";

export function BattleActionBar() {
  const isAttacking = useBattleStore((state) => state.isAttacking);
  const unlockedAbilities = useBattleStore((state) => state.unlockedAbilities);
  const abilities = useBattleStore((state) => state.abilities);
  const slots = [1, 2, 3];

  return (
    <View style={styles.wrap}>
      <PrimaryButton
        label="Quick Attack"
        displayText={isAttacking ? "Attacking..." : "Quick Attack"}
        icon="bolt"
        loading={isAttacking}
        onPress={() => useBattleStore.getState().attack()}
      />

      <View style={styles.abilitiesContainer}>
        <Text style={styles.sectionTitle}>Special Abilities</Text>
        <View style={styles.abilitiesList}>
          {slots.map((slot) => {
            const ability = abilities.find((a) => a.slot === slot);
            const name = ability?.name || `Ability ${slot}`;
            const isUnlocked = unlockedAbilities.includes(slot);

            if (isUnlocked) {
              return (
                <Tap
                  key={slot}
                  label={name}
                  style={[styles.abilityBtnActive, isAttacking && styles.btnDisabled]}
                  disabled={isAttacking}
                  onPress={() => useBattleStore.getState().useAbility(slot)}
                >
                  <View style={styles.abilityHeader}>
                    <View style={styles.abilityIconBadge}>
                      <MaterialIcons
                        name={slot === 3 ? "stars" : slot === 2 ? "health-and-safety" : "flash-on"}
                        size={16}
                        color="#0BA84A"
                      />
                    </View>
                    <View style={styles.abilityInfo}>
                      <Text style={styles.abilityActiveName} numberOfLines={1}>
                        {name}
                      </Text>
                      {ability?.description ? (
                        <Text style={styles.abilityActiveDesc} numberOfLines={1}>
                          {ability.description}
                        </Text>
                      ) : null}
                    </View>
                    {ability?.multiplier ? (
                      <View style={styles.multiplierBadge}>
                        <Text style={styles.multiplierText}>{ability.multiplier}x</Text>
                      </View>
                    ) : null}
                  </View>
                </Tap>
              );
            }

            return (
              <View key={slot} style={styles.abilityBtnLocked}>
                <View style={styles.abilityHeader}>
                  <View style={styles.lockedIconBadge}>
                    <MaterialIcons name="lock" size={15} color="#879089" />
                  </View>
                  <View style={styles.abilityInfo}>
                    <Text style={styles.abilityLockedName} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={styles.abilityTooltipText}>
                      Finish Quiz {slot} to earn this move
                    </Text>
                  </View>
                  <View style={styles.lockedBadge}>
                    <Text style={styles.lockedBadgeText}>Not Earned</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <Tap
        label="Stop Battle"
        style={styles.giveUpBtn}
        disabled={isAttacking}
        onPress={() => useBattleStore.getState().openGiveUpConfirm()}
      >
        <MaterialIcons name="flag" size={15} color="#8C1D24" />
        <Text style={styles.giveUpText}>Stop Battle</Text>
      </Tap>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#606C62",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  abilitiesContainer: {
    gap: 6,
  },
  abilitiesList: {
    gap: 8,
  },
  abilityBtnActive: {
    borderWidth: 1.5,
    borderColor: "#A3E6BA",
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  abilityBtnLocked: {
    borderWidth: 1,
    borderColor: "#E2E7E3",
    backgroundColor: "#F8FAF8",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  abilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  abilityIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  lockedIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EDF1EE",
    alignItems: "center",
    justifyContent: "center",
  },
  abilityInfo: {
    flex: 1,
  },
  abilityActiveName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1B4D2E",
  },
  abilityActiveDesc: {
    fontSize: 11,
    color: "#406D4F",
    marginTop: 2,
  },
  abilityLockedName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7B857F",
  },
  abilityTooltipText: {
    fontSize: 11,
    color: "#9CA5A0",
    marginTop: 2,
  },
  multiplierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#DCFCE7",
  },
  multiplierText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0BA84A",
  },
  lockedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#EDF1EE",
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#879089",
  },
  giveUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#F2C4C4",
    backgroundColor: "#FFF6F6",
  },
  giveUpText: { color: "#8C1D24", fontSize: 14, fontWeight: "800" },
});
