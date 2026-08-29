import React from "react";
import { Text, View } from "react-native";
import { styles } from "../../../../styles/theme";

export function LocationFacilities({ facilities }: { facilities: string[] }) {
  if (!facilities.length) return null;

  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>PARK FACILITIES</Text>
      <View style={styles.badges}>
        {facilities.map((fac) => (
          <Text key={fac} style={styles.badge}>
            ✓ {fac}
          </Text>
        ))}
      </View>
    </View>
  );
}
