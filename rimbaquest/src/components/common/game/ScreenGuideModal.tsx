import React, { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Image, ImageSourcePropType, Modal, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../../../constants/fonts";
import { ScreenGuideTopic, useScreenGuideStore } from "../../../store/useScreenGuideStore";
import { Tap } from "../Tap";
import { GAME_COLORS } from "./gameTheme";

// `screenshot` steps show an annotated full-screen capture instead of an icon.
type GuideStep = { title: string; instruction: string; image: ImageSourcePropType; screenshot?: boolean };
type Guide = { title: string; steps: GuideStep[] };

// Full-screen captures are 720x1435; the frame keeps that shape.
const SCREENSHOT_ASPECT = 720 / 1435;

const GUIDES: Record<ScreenGuideTopic, Guide> = {
  profile: {
    title: "My Profile",
    steps: [
      { title: "Your animal stats", instruction: "These numbers show how many animals you have found, and how many of each group, like mammals and birds.", image: require("../../../../assets/guides-full/profile/step-1.jpg"), screenshot: true },
      { title: "Level up to 100%", instruction: "Find more animals to raise your level. Can you fill your collection all the way to 100%?", image: require("../../../../assets/guides-full/profile/step-2.jpg"), screenshot: true },
      { title: "Edit your profile", instruction: "Tap Edit Profile to change your explorer name or pick a new animal avatar.", image: require("../../../../assets/guides-full/profile/step-3.jpg"), screenshot: true },
      { title: "Log out", instruction: "Tap Log Out when you finish playing. Your animals stay saved for next time!", image: require("../../../../assets/guides-full/profile/step-4.jpg"), screenshot: true },
      { title: "Need help?", instruction: "If you ever get stuck, tap this i button to see this guide again.", image: require("../../../../assets/guides-full/profile/step-5.jpg"), screenshot: true },
    ],
  },
  discover: {
    title: "Wildlife Locations",
    steps: [
      { title: "Search for a place", instruction: "Type a place name or area here to find it fast.", image: require("../../../../assets/guides-full/locations/step-1.jpg"), screenshot: true },
      { title: "Filter buttons", instruction: "These buttons help you find the best places. Tap Share location to see places near you, and swipe sideways for more buttons.", image: require("../../../../assets/guides-full/locations/step-2.jpg"), screenshot: true },
      { title: "List or map", instruction: "Choose List to see places one by one, or Map to see them on a map.", image: require("../../../../assets/guides-full/locations/step-3.jpg"), screenshot: true },
      { title: "Type of place", instruction: "Pick zoos, parks, aquariums and more to see only that kind of place.", image: require("../../../../assets/guides-full/locations/step-4.jpg"), screenshot: true },
      { title: "How far away?", instruction: "Choose how far you want to go. Pick a small number to find places close to you.", image: require("../../../../assets/guides-full/locations/step-5.jpg"), screenshot: true },
      { title: "Sort the list", instruction: "Sort places by name from A to Z, or show the nearest places first.", image: require("../../../../assets/guides-full/locations/step-6.jpg"), screenshot: true },
      { title: "Open a spot", instruction: "Tap a place to see where it is, when it is open and what animals you might spot there.", image: require("../../../../assets/guides-full/locations/step-7.jpg"), screenshot: true },
      { title: "Need help?", instruction: "If you ever get stuck, tap this i button to see this guide again.", image: require("../../../../assets/guides-full/locations/step-8.jpg"), screenshot: true },
    ],
  },
  capture: {
    title: "Capture an Animal",
    steps: [
      { title: "Snap a photo", instruction: "Point your camera at a real animal and tap the big white button to take a photo.", image: require("../../../../assets/guides-full/capture/step-1.jpg"), screenshot: true },
      { title: "Gallery and flash", instruction: "Took a photo earlier? Tap the little picture to choose it from your gallery. Tap the lightning button to turn the flash on or off.", image: require("../../../../assets/guides-full/capture/step-2.jpg"), screenshot: true },
      { title: "Real animals only", instruction: "Only use photos of animals you really saw. Pictures from books, websites or another screen don't count!", image: require("../../../../assets/guides-full/capture/step-3.jpg"), screenshot: true },
      { title: "Checking your photo", instruction: "Wait a moment while we look at your photo. Tap Cancel if you want to stop.", image: require("../../../../assets/guides-full/capture/step-4.jpg"), screenshot: true },
      { title: "Photo checked!", instruction: "When the check is done, tap Next to see which animal it could be.", image: require("../../../../assets/guides-full/capture/step-5.jpg"), screenshot: true },
      { title: "Pick the animal", instruction: "Tap the animal that matches what you saw, then tap Continue.", image: require("../../../../assets/guides-full/capture/step-6.jpg"), screenshot: true },
      { title: "Peek at your photo", instruction: "Not sure? Tap the eye button to hide the choices and look at your photo again.", image: require("../../../../assets/guides-full/capture/step-7.jpg"), screenshot: true },
      { title: "Did you get it right?", instruction: "We'll tell you if your guess was right and share something about the animal. Tap Continue.", image: require("../../../../assets/guides-full/capture/step-8.jpg"), screenshot: true },
      { title: "Where did you see it?", instruction: "Tap the location box to choose the place where you found the animal.", image: require("../../../../assets/guides-full/capture/step-9.jpg"), screenshot: true },
      { title: "Save your discovery", instruction: "Choose a location first, then tap Confirm & Save to add the animal to your collection. Tap No if it's the wrong animal.", image: require("../../../../assets/guides-full/capture/step-10.jpg"), screenshot: true },
      { title: "You did it!", instruction: "Tap View Card to see your animal card, or Record Another Discovery to find more animals.", image: require("../../../../assets/guides-full/capture/step-11.jpg"), screenshot: true },
      { title: "Need help?", instruction: "If you ever get stuck, tap this i button to see this guide again.", image: require("../../../../assets/guides-full/capture/step-12.jpg"), screenshot: true },
    ],
  },
  collection: {
    title: "My Collection",
    steps: [
      { title: "Level up!", instruction: "This bar fills up as you find animals. Fill it to reach the next level and become a super animal collector!", image: require("../../../../assets/guides-full/collection/step-1.jpg"), screenshot: true },
      { title: "Snap a photo", instruction: "Tap the camera to take a photo of an animal. It will be saved in your collection.", image: require("../../../../assets/guides-full/collection/step-2.jpg"), screenshot: true },
      { title: "Search for an animal", instruction: "Type an animal's name here to find it quickly.", image: require("../../../../assets/guides-full/collection/step-3.jpg"), screenshot: true },
      { title: "Pick an animal group", instruction: "Tap a group like Birds or Reptiles to see only those animals. Swipe the buttons sideways to see more, or tap All to see everyone.", image: require("../../../../assets/guides-full/collection/step-4.jpg"), screenshot: true },
      { title: "Found or locked?", instruction: "Animals you have found show their photo. Tap one to learn about it! Locked cards are animals still waiting for you to find them.", image: require("../../../../assets/guides-full/collection/step-5.jpg"), screenshot: true },
      { title: "Need help?", instruction: "If you ever get stuck, tap this i button to see this guide again.", image: require("../../../../assets/guides-full/collection/step-6.jpg"), screenshot: true },
    ],
  },
  species: {
    title: "Animal Card",
    steps: [
      { title: "See the animal", instruction: "Tap this card to see a big picture of the animal.", image: require("../../../../assets/guides-full/species/step-1.jpg"), screenshot: true },
      { title: "Tap the tabs", instruction: "Each wooden tab opens a different page. Tap one to switch!", image: require("../../../../assets/guides-full/species/step-2.jpg"), screenshot: true },
      { title: "About", instruction: "Learn where the animal lives, what it eats and how it helps nature.", image: require("../../../../assets/guides-full/species/step-3.jpg"), screenshot: true },
      { title: "Fun Facts", instruction: "Read cool facts about the animal that you can share with friends!", image: require("../../../../assets/guides-full/species/step-4.jpg"), screenshot: true },
      { title: "Battle Stats", instruction: "See how strong this animal card is in battles. Finish a quiz to unlock new abilities!", image: require("../../../../assets/guides-full/species/step-5.jpg"), screenshot: true },
      { title: "Gallery", instruction: "See all the photos you took of this animal and where you spotted it.", image: require("../../../../assets/guides-full/species/step-6.jpg"), screenshot: true },
      { title: "Ask WildGuide", instruction: "Tap the chat bubble to ask WildGuide any question about this animal.", image: require("../../../../assets/guides-full/species/step-7.jpg"), screenshot: true },
      { title: "Need help?", instruction: "If you ever get stuck, tap this i button to see this guide again.", image: require("../../../../assets/guides-full/species/step-8.jpg"), screenshot: true },
    ],
  },
  battle: {
    title: "Card Battle",
    steps: [
      { title: "Start a battle", instruction: "Tap Enter Battle when you're ready to play with your animal cards.", image: require("../../../../assets/guides-full/battle/step-1.jpg"), screenshot: true },
      { title: "Pick a battle type", instruction: "Practice vs Bot is for warming up and gives no points. Challenge a Friend to win +5 points, but you lose 3 if you lose.", image: require("../../../../assets/guides-full/battle/step-2.jpg"), screenshot: true },
      { title: "Random habitat", instruction: "Each battle happens in a random habitat. Animals that live there get a BOOST: +20% attack and +20% defence!", image: require("../../../../assets/guides-full/battle/step-3.jpg"), screenshot: true },
      { title: "Ready or resting", instruction: "Only Ready cards can battle. After a match, the card you used rests for 2 hours.", image: require("../../../../assets/guides-full/battle/step-4.jpg"), screenshot: true },
      { title: "Choose your animal", instruction: "Tap a card to look at it. Pick an animal that lives in today's habitat for a boost!", image: require("../../../../assets/guides-full/battle/step-5.jpg"), screenshot: true },
      { title: "Check its skills", instruction: "See your card's attack and abilities, then tap Use This Card. Locked abilities open when you pass their quiz.", image: require("../../../../assets/guides-full/battle/step-6.jpg"), screenshot: true },
      { title: "Health, Energy and Shield", instruction: "Hearts are your health. Lightning is Energy for special moves. Shield blocks some damage. Bring the bot's hearts to zero to win!", image: require("../../../../assets/guides-full/battle/step-7.jpg"), screenshot: true },
      { title: "Make your move", instruction: "Attack is always free. Abilities hit harder but cost Energy. You get +2 Energy every turn, up to 8.", image: require("../../../../assets/guides-full/battle/step-8.jpg"), screenshot: true },
      { title: "Give up", instruction: "Tap Give Up if you want to stop the match early.", image: require("../../../../assets/guides-full/battle/step-9.jpg"), screenshot: true },
      { title: "Your deck", instruction: "See how many cards are ready and how many are resting. Tap ? to learn more.", image: require("../../../../assets/guides-full/battle/step-10.jpg"), screenshot: true },
      { title: "Friends and leaderboard", instruction: "Tap Friends to add and challenge friends. Tap Leaderboard to see your rank.", image: require("../../../../assets/guides-full/battle/step-11.jpg"), screenshot: true },
      { title: "Add a friend", instruction: "Share your code with a friend, or type their code and tap Add. Tap Battle! to send them an invite.", image: require("../../../../assets/guides-full/battle/step-12.jpg"), screenshot: true },
      { title: "Climb the board", instruction: "Win friend battles to earn points and climb the leaderboard. Practice battles don't change your points.", image: require("../../../../assets/guides-full/battle/step-13.jpg"), screenshot: true },
      { title: "Need help?", instruction: "If you ever get stuck, tap this i button to see this guide again.", image: require("../../../../assets/guides-full/battle/step-14.jpg"), screenshot: true },
    ],
  },
};

export function ScreenGuideModal() {
  const topic = useScreenGuideStore((state) => state.topic);
  const closeGuide = useScreenGuideStore((state) => state.closeGuide);
  const [index, setIndex] = useState(0);
  const insets = useSafeAreaInsets();
  useEffect(() => setIndex(0), [topic]);
  const guide = topic ? GUIDES[topic] : null;
  const step = guide?.steps[index];

  return (
    <Modal visible={Boolean(guide)} transparent statusBarTranslucent animationType="fade" onRequestClose={closeGuide}>
      <View style={[styles.backdrop, step?.screenshot && { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10, paddingHorizontal: 12 }]}>
        {guide && step && (
          // Screenshot guides stretch to nearly full screen so the capture is readable.
          <View style={[styles.card, step.screenshot && styles.tallCard]}>
            <View style={styles.headingRow}>
              <Text style={styles.heading}>{guide.title}</Text>
              <Tap label="Close guide" onPress={closeGuide} style={styles.close}>
                <MaterialIcons name="close" size={23} color={GAME_COLORS.ink} />
              </Tap>
            </View>
            <Text style={styles.count}>EXAMPLE {index + 1} OF {guide.steps.length}</Text>
            {step.screenshot ? (
              <View style={styles.screenshotArea}>
                <View style={styles.screenshotFrame}>
                  <Image source={step.image} style={styles.screenshot} resizeMode="cover" />
                </View>
              </View>
            ) : (
              <View style={styles.imageFrame}>
                <Image source={step.image} style={styles.image} resizeMode="contain" />
              </View>
            )}
            <Text style={[styles.stepTitle, step.screenshot && styles.tightTitle]}>{step.title}</Text>
            <Text style={styles.instruction}>{step.instruction}</Text>
            <View style={[styles.dots, step.screenshot && styles.tightDots]} accessibilityLabel={`Step ${index + 1} of ${guide.steps.length}`}>
              {guide.steps.map((item, dot) => <View key={item.title} style={[styles.dot, dot === index && styles.activeDot]} />)}
            </View>
            <View style={styles.actions}>
              <Tap label="Previous guide example" disabled={index === 0} onPress={() => setIndex((value) => value - 1)} style={[styles.action, index === 0 && styles.disabled]}>
                <Text style={styles.actionText}>Back</Text>
              </Tap>
              <Tap label={index === guide.steps.length - 1 ? "Finish guide" : "Next guide example"} onPress={() => index === guide.steps.length - 1 ? closeGuide() : setIndex((value) => value + 1)} style={[styles.action, styles.primaryAction]}>
                <Text style={styles.actionText}>{index === guide.steps.length - 1 ? "Done" : "Next"}</Text>
              </Tap>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "rgba(8,22,14,0.7)" },
  card: { width: "100%", maxWidth: 380, alignSelf: "center", padding: 18, borderRadius: 22, borderWidth: 4, borderColor: GAME_COLORS.ink, backgroundColor: GAME_COLORS.paper },
  tallCard: { flex: 1, maxWidth: 480, padding: 14 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heading: { flex: 1, fontFamily: FONTS.display, fontSize: 25, color: GAME_COLORS.ink },
  close: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "#D8ECCE", borderWidth: 2, borderColor: GAME_COLORS.ink },
  count: { fontFamily: FONTS.bodyExtraBold, fontSize: 12, color: "#50715A", marginTop: 6 },
  imageFrame: { height: 170, alignItems: "center", justifyContent: "center", marginTop: 12, borderRadius: 16, borderWidth: 2, borderColor: "#B9D3B5", backgroundColor: "#E7F2DF" },
  image: { width: "85%", height: 146 },
  screenshotArea: { flex: 1, marginTop: 8, alignItems: "center" },
  screenshotFrame: { height: "100%", maxWidth: "100%", aspectRatio: SCREENSHOT_ASPECT, overflow: "hidden", borderRadius: 16, borderWidth: 3, borderColor: GAME_COLORS.ink, backgroundColor: "#E7F2DF" },
  screenshot: { width: "100%", height: "100%" },
  stepTitle: { fontFamily: FONTS.display, fontSize: 22, color: GAME_COLORS.ink, marginTop: 14 },
  instruction: { fontFamily: FONTS.bodyBold, fontSize: 15, lineHeight: 21, color: "#274430", marginTop: 5, minHeight: 63 },
  tightTitle: { marginTop: 10 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginVertical: 15 },
  tightDots: { marginVertical: 10 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#B5C9B1" },
  activeDot: { width: 24, backgroundColor: GAME_COLORS.ink },
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 46, borderRadius: 12, borderWidth: 2, borderColor: GAME_COLORS.ink, backgroundColor: "#D8ECCE" },
  primaryAction: { backgroundColor: "#FFD66E" },
  disabled: { opacity: 0.4 },
  actionText: { fontFamily: FONTS.button, fontSize: 18, color: GAME_COLORS.ink },
});
