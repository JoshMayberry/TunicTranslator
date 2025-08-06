<template>
  <div class="translation-wrapper">
    <template v-for="(item, i) in translation" :key="i">
      <span
        v-if="item.text"
        class="translation-item"
        :class="(darkMode ? 'dark-mode ' : '') + (isSelectable ? 'selectable' : '')"
        :style="'color:'+getColorFromConfidence(item.confidence)+';'"
        @click="() => handleClickWord(item, i)"
      >{{ item.text }}</span>
      <span v-else class="gap-block sentence-item"> </span>
    </template>
  </div>
</template>

<script lang="ts">
import { combineWord, getColorFromConfidence, getPheneticWord, getSentence, PossibleRupeeValue, TranslationWord } from '@/models/Rupee';
import { CircleTheory } from '@/server/types';

export default {
  name: 'TranslationSentence',
  emits: ["select:word"],
  data() {
    return {
      activeTabIndex: 0,
    }
  },
  props: {
    rupeeIdList: { type: Object as () => Array<PossibleRupeeValue>, required: true },
    soundCatalog: { type: Object as () => Record<number, string>, required: true },
    wordGuessCatalog: { type: Object as () => Record<string, string>, required: true },
    wordConfidenceCatalog: { type: Object as () => Record<string, number>, required: true },
    circleTheory: { type: String as () => CircleTheory, required: true },
    useWordGuess: { type: Boolean, required: true },
    useThresholdColors: { type: Boolean, required: true },
    darkMode: { type: Boolean, required: true },
    isSelectable: { type: Boolean, default: false },
  },
  computed: {
    translation(): Array<TranslationWord> {
      const sentence = [] as Array<TranslationWord>;
      for (const sentenceWord of getSentence(this.rupeeIdList)) {
          const word = sentenceWord.word;
          if (!word.length) {
            sentence.push({
              word,
              text: "",
            });
            continue;
          }

          if (this.useWordGuess) {
            const combined = combineWord(word);
            const possibleWord = this.wordGuessCatalog[combined];
            if (possibleWord) {
              sentence.push({
                word,
                text: possibleWord,
                confidence: this.wordConfidenceCatalog[combined] || 0,
              });
              continue;
            }
          }

          let pheneticWord = getPheneticWord(this.soundCatalog, this.circleTheory, word);
          if (pheneticWord != "") {
            sentence.push({
              word,
              text: pheneticWord,
            });
          }
      }

      return sentence;
    }
  },
  methods: {
    getColorFromConfidence(confidence?: number): string {
      if (!this.useThresholdColors) {
        return "black"
      }
      return getColorFromConfidence(confidence)
    },
    handleClickWord(translationWord: TranslationWord, index: number) {
      this.$emit("select:word", { translationWord, index });
    },
  },
}
</script>

<style scoped>
.translation-wrapper {
  display: flex;
  flex: 1;
}

.translation-item {
  font-size: 12px;
  color: black;
  margin-top: auto;
  font-family: monospace;
}

.translation-item.dark-mode {
  color: white;
}


.translation-item.selectable {
  cursor: pointer;
}

.gap-block {
  width: 4px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  color: #aaa;
  font-size: 18px;
}
</style>
