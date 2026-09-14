import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useCollectionStore } from "../../../../store/useCollectionStore";
import { Tap } from "../../../common/Tap";
import { styles as globalStyles } from "../../../../styles/theme";

export function CollectionSearchBar() {
  const search = useCollectionStore((state) => state.search);
  const setSearch = useCollectionStore((state) => state.setSearch);

  return (
    <View style={[globalStyles.searchBox, styles.searchBox]}>
      <MaterialIcons
        name="search"
        size={18}
        color="#879089"
        style={styles.searchIcon}
      />
      <TextInput
        placeholder="Type an animal name"
        placeholderTextColor="#879089"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        style={globalStyles.searchInput}
      />
      {search.length > 0 && (
        <Tap
          label="Clear search"
          style={globalStyles.searchClear}
          onPress={() => setSearch("")}
        >
          <MaterialIcons name="close" size={16} color="#087B35" />
        </Tap>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: { marginHorizontal: 16 },
  searchIcon: { marginRight: 8 },
});
