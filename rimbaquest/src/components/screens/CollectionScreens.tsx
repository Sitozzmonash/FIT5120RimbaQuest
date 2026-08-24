import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { QuizQuestion, Screen, Species } from '../../types';
import { CATEGORIES } from '../../constants/seed';
import { imageFor } from '../../constants/images';
import { Tap } from '../common/Tap';
import { Header, Info, ProgressCard, Section, Stat } from '../common/CommonUI';
import { styles } from '../../styles/theme';

export function CollectionScreen({
  speciesList,
  discoveredIds,
  filter,
  setFilter,
  displayProgress,
  onSelectSpecies,
  onSelectLocked,
}: {
  speciesList: Species[];
  discoveredIds: string[];
  filter: string;
  setFilter: (f: string) => void;
  displayProgress: { found: number; total: number; xp: number; level?: number };
  onSelectSpecies: (s: Species) => void;
  onSelectLocked: (s: Species) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="My Collection" back={false} />
      <ProgressCard progress={displayProgress} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {['All', ...CATEGORIES].map((item) => (
          <Tap
            key={item}
            label={`Filter ${item}`}
            style={[styles.chip, filter === item && styles.chipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>
              {item === 'All' ? 'All Wildlife' : `${item}s`}
            </Text>
          </Tap>
        ))}
      </ScrollView>
      <View style={styles.grid}>
        {speciesList.map((item) =>
          discoveredIds.includes(item.id) ? (
            <Tap
              key={item.id}
              label={`View ${item.common_name}`}
              style={styles.speciesCard}
              onPress={() => onSelectSpecies(item)}
            >
              <Image source={imageFor(item)!} style={styles.speciesImage} />
              <Text numberOfLines={1} style={styles.cardTitle}>{item.common_name}</Text>
              <View style={styles.cardBottomRow}>
                <Text style={styles.categoryText}>{item.category}</Text>
                <Text style={styles.hpBadgeMini}>❤️ {item.hp || 120}</Text>
              </View>
            </Tap>
          ) : (
            <Tap
              key={item.id}
              label={`Preview undiscovered ${item.common_name}`}
              style={styles.speciesCard}
              onPress={() => onSelectLocked(item)}
            >
              <Image source={imageFor(item)!} style={[styles.speciesImage, styles.lockedSpeciesImage]} />
              <View style={styles.lockedOverlay}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.lockedLabel}>UNDISCOVERED</Text>
              </View>
              <Text numberOfLines={1} style={styles.cardTitle}>{item.common_name}</Text>
              <Text style={styles.muted}>{item.category}</Text>
            </Tap>
          )
        )}
      </View>
    </ScrollView>
  );
}

export function SpeciesDetailScreen({
  species,
  screen,
  photos,
  quizQuestion,
  quizAnswer,
  onTabChange,
  onStartBattle,
  onOpenQuiz,
  onAnswerQuiz,
  onFinishQuiz,
  onBack,
}: {
  species: Species;
  screen: Screen;
  photos: string[];
  quizQuestion: QuizQuestion | null;
  quizAnswer: number | null;
  onTabChange: (s: Screen) => void;
  onStartBattle: () => void;
  onOpenQuiz: () => void;
  onAnswerQuiz: (idx: number) => void;
  onFinishQuiz: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title={species.common_name} onBack={onBack} />
      <View style={styles.tabs}>
        {([
          ['about', 'About'],
          ['battle_stats', 'Battle Stats'],
          ['facts', 'Fun Facts'],
          ['gallery', 'Gallery'],
        ] as [Screen, string][]).map(([key, label]) => (
          <Tap
            key={key}
            label={label}
            style={[styles.tab, screen === key && styles.tabActive]}
            onPress={() => onTabChange(key)}
          >
            <Text style={[styles.tabText, screen === key && styles.tabTextActive]}>{label}</Text>
          </Tap>
        ))}
      </View>

      {screen === 'about' && <AboutTab item={species} />}
      {screen === 'battle_stats' && <BattleStatsTab item={species} onBattle={onStartBattle} />}
      {screen === 'facts' && <FactsTab item={species} onPlay={onOpenQuiz} />}
      {screen === 'gallery' && <GalleryTab photos={photos} />}
      {screen === 'quiz' && (
        <QuizTab
          item={species}
          question={quizQuestion}
          answer={quizAnswer}
          onAnswer={onAnswerQuiz}
          onDone={onFinishQuiz}
        />
      )}
    </ScrollView>
  );
}

export function LockedScreen({
  species,
  onStartDiscovery,
  onBack,
}: {
  species: Species;
  onStartDiscovery: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header title="Undiscovered Wildlife" onBack={onBack} />
      <View style={styles.lockedDetail}>
        <Image source={imageFor(species)!} style={styles.lockedImage} />
        <Text style={styles.pageTitle}>
          {species.common_name} <Text style={styles.categoryPill}>{species.category}</Text>
        </Text>
        <Text style={styles.scientific}>{species.scientific_name}</Text>
        <Info label="HABITAT" value={species.habitat} />
        <Info label="DISCOVERY HINT" value="Explore Malaysian nature parks or reserves safely to encounter and unlock this species!" />
        <View style={styles.lockedWarningBox}>
          <Text style={styles.lockedWarningTitle}>🔒 Detailed Card Info Locked</Text>
          <Text style={styles.lockedWarningText}>
            Fun facts, battle abilities, diet details, and personal observation galleries unlock once you record your first confirmed sighting!
          </Text>
        </View>
        <Tap label="Record discovery" style={styles.primary} onPress={onStartDiscovery}>
          <Text style={styles.primaryText}>📷 Record Sighting to Unlock</Text>
        </Tap>
      </View>
    </ScrollView>
  );
}

function AboutTab({ item }: { item: Species }) {
  const role =
    item.category === 'Butterfly'
      ? 'Helps pollinate flowering plants while moving between gardens and forest edges.'
      : item.category === 'Bird'
      ? 'Helps spread seeds and supports a healthy rainforest food web.'
      : item.category === 'Reptile'
      ? 'Helps keep the food web in balance as part of its wetland and forest habitat.'
      : 'Plays an important role in Malaysia’s forest food web and healthy habitat.';

  return (
    <>
      <View style={styles.badges}>
        <Text style={styles.badge}>Level 1 · Discovered</Text>
        <Text style={styles.badge}>{item.category}</Text>
      </View>
      <Info label="SCIENTIFIC NAME" value={item.scientific_name} />
      {item.act716_status && <Info label="MALAYSIAN LEGAL PROTECTION" value={item.act716_status} />}
      <Info label="HABITAT" value={item.habitat} />
      <Info label="DIET" value={item.diet} />
      <Info label="ECOLOGICAL ROLE" value={role} />
      <Info label="RESPONSIBLE OBSERVATION" value="Always observe wildlife from a respectful distance without feeding, touching or making loud noises." />
    </>
  );
}

function BattleStatsTab({ item, onBattle }: { item: Species; onBattle: () => void }) {
  return (
    <View style={styles.battleStatsContainer}>
      <View style={styles.battleStatHeader}>
        <Text style={styles.battleStatHeaderTitle}>Card Combat Attributes</Text>
        <View style={styles.stats}>
          <Stat value={`❤️ ${item.hp || 120}`} label="Base HP" />
          <Stat value={`⚔️ ${item.base_attack || 25}`} label="Base Attack" />
        </View>
      </View>

      <Section title="SPECIAL ABILITIES (Iteration 2)" />
      {[
        item.ability_1 || 'Swift Pounce',
        item.ability_2 || 'Wild Roar',
        item.ability_3 || 'Guardian Guard',
      ].map((ability, idx) => (
        <View key={idx} style={styles.abilitySlotLocked}>
          <Text style={styles.abilitySlotIcon}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.abilitySlotName}>Ability {idx + 1}: {ability}</Text>
            <Text style={styles.abilitySlotHint}>Unlocked by completing Species Quiz {idx + 1} in Iteration 2!</Text>
          </View>
        </View>
      ))}

      <Tap label="Battle with Card" style={styles.primary} onPress={onBattle}>
        <Text style={styles.primaryText}>⚔️ Enter Card Battle</Text>
      </Tap>
    </View>
  );
}

function FactsTab({ item, onPlay }: { item: Species; onPlay: () => void }) {
  return (
    <>
      <View style={styles.quiz}>
        <Text style={styles.quizLabel}>KNOWLEDGE QUIZ</Text>
        <Text style={styles.quizTitle}>Test Your Rainforest Knowledge!</Text>
        <Text style={styles.muted}>Answer a quiz question about {item.common_name} to test what you learned!</Text>
        <Tap label="Play quiz" style={styles.quizButton} onPress={onPlay}>
          <Text style={styles.primaryText}>▶ Play Quiz</Text>
        </Tap>
      </View>
      <Section title="Species Fun Facts" />
      {[item.fun_fact, 'Wild animals need peaceful space to thrive in their natural habitat.', 'Every observation recorded contributes to wildlife appreciation!'].map((fact, idx) => (
        <Text key={idx} style={styles.fact}>• {fact}</Text>
      ))}
    </>
  );
}

function QuizTab({
  item,
  question,
  answer,
  onAnswer,
  onDone,
}: {
  item: Species;
  question: QuizQuestion | null;
  answer: number | null;
  onAnswer: (idx: number) => void;
  onDone: () => void;
}) {
  const activeQuestion = question ?? { question: `Which statement about ${item.common_name} is true?`, options: [item.fun_fact], correct_index: 0 };
  const correct = answer === activeQuestion.correct_index;
  return (
    <View style={styles.quiz}>
      <Text style={styles.quizLabel}>QUESTION 1 OF 1</Text>
      <Text style={styles.quizTitle}>{activeQuestion.question}</Text>
      {activeQuestion.options.map((option, index) => (
        <Tap
          key={`${option}-${index}`}
          label={`Answer ${index + 1}`}
          style={[styles.secondary, styles.quizOption, answer === index && styles.quizOptionSelected]}
          onPress={() => onAnswer(index)}
        >
          <Text style={[styles.secondaryText, styles.quizOptionText, answer === index && styles.quizOptionTextSelected]}>
            {option}
          </Text>
        </Tap>
      ))}
      {answer !== null && (
        <>
          <Text style={styles.hint}>
            {correct ? '🎉 Great job! That is correct.' : activeQuestion.explanation || 'Not quite. Read the fun facts and try again!'}
          </Text>
          <Tap label="Return to fun facts" style={styles.primary} onPress={onDone}>
            <Text style={styles.primaryText}>Back to Fun Facts</Text>
          </Tap>
        </>
      )}
    </View>
  );
}

function GalleryTab({ photos }: { photos: string[] }) {
  return (
    <>
      <Text style={styles.subTitle}>Your past personal discovery photos for this species.</Text>
      {photos.length ? (
        <View style={styles.gallery}>
          {photos.map((uri, index) => (
            <Image key={`${uri}-${index}`} source={{ uri }} style={styles.galleryImage} />
          ))}
        </View>
      ) : (
        <View style={styles.galleryEmpty}>
          <Text style={styles.galleryEmptyTitle}>No personal photos yet</Text>
          <Text style={styles.muted}>Record this species again to add another photo to its gallery.</Text>
        </View>
      )}
    </>
  );
}
