<template>
  <div class="sentence-display" :class="highlightOnHover ? 'sentence-display--highlight-hover' : ''" style="style">
    <template v-for="(sentenceWord, groupIndex) in groupedRupeeList" :key="groupIndex">
      <div class="sentence-word-wrapper">
        <div class="word-display">
          <template v-if="sentenceWord?.word?.length" v-for="(rupeeId, index) in sentenceWord.word" :key="`${groupIndex}-${index}`">
            <span
              class="sentence-item-wrapper"
              :class="{ selected: (sentenceWord.indexStart + index) === selectedIndex }"
              @click="() => handleClick(rupeeId, groupIndex, index, sentenceWord)"
              :aria-describedby="(tooltipId !== -1) ?`tooltip-sentence-rupee-${tooltipId}-${index}` : ''"
            >
                <template v-if="typeof rupeeId == 'number'">
                <teleport to="body" v-if="(tooltipId !== -1)">
                  <mcw-tooltip
                    :id="`tooltip-sentence-rupee-${tooltipId}-${index}`"
                    :persistent="true"
                  >
                    <TranslationSentence
                      :rupee-id-list="[rupeeId]"
                      :sound-catalog="soundCatalog"
                      :word-guess-catalog="wordGuessCatalog"
                      :word-confidence-catalog="wordConfidenceCatalog"
                      :use-threshold-colors="useThresholdColors"
                      :circle-theory="circleTheory"
                      :use-word-guess="false"
                      :dark-mode="false"
                    />
                  </mcw-tooltip>
                </teleport>
                <RupeeDisplay
                  :rupee="explodeRupee ? getRupeeInnerRepresentaion(rupeeId) : getRupeeFromRepresentation(rupeeId)"
                  :width="width"
                  :linewidth="linewidth"
                  :is-interactive="false"
                  :outer-color="outerColor"
                  :inner-color="innerColor"
                  :empty-color="emptyColor"
                  :highlight-sound="highlightSound"
                  :sound-color="soundColor"
                  :use-threhold-colors="useThresholdColors"
                  :confidence="confidence"
                  :confidence-catalog="confidenceCatalog"
                  :sound-catalog="soundCatalog"
                  :is-debug="false"
                  :is-word="true"
                  class="sentence-item"
                />
                <RupeeDisplay
                  v-if="explodeRupee && shouldShowSecondRupee(rupeeId)"
                  :rupee="explodeRupee ? getRupeeOuterRepresentaion(rupeeId) : getRupeeFromRepresentation(rupeeId)"
                  :width="width"
                  :linewidth="linewidth"
                  :is-interactive="false"
                  :outer-color="outerColor"
                  :inner-color="innerColor"
                  :empty-color="emptyColor"
                  :highlight-sound="highlightSound"
                  :sound-color="soundColor"
                  :use-threhold-colors="useThresholdColors"
                  :confidence="confidence"
                  :confidence-catalog="confidenceCatalog"
                  :sound-catalog="soundCatalog"
                  :is-debug="false"
                  :is-word="true"
                  class="sentence-item"
                />
              </template>
              <span v-else-if="typeof rupeeId === 'string'" class="text-block sentence-item">{{ rupeeId }}</span>
              <span v-else class="gap-block sentence-item"> </span>
            </span>
          </template>
           <span
              v-else 
              class="sentence-item-wrapper"
              :class="{ selected: sentenceWord.indexStart === selectedIndex }"
              @click="() => handleClick(null, groupIndex, sentenceWord.indexStart, sentenceWord)"
              :style="'height: 100%;'"
            >
            <span class="gap-block sentence-item"> </span>
          </span>
        </div>
        <TranslationSentence
          v-if="isWordMode"
          :rupee-id-list="sentenceWord.word"
          :sound-catalog="soundCatalog"
          :word-guess-catalog="wordGuessCatalog"
          :word-confidence-catalog="wordConfidenceCatalog"
          :circle-theory="circleTheory"
          :use-word-guess="useWordGuess"
          :use-threshold-colors="useThresholdColors"
          :dark-mode="false"
          @click="() => handleClickWord(sentenceWord, groupIndex)"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import RupeeDisplay from "./RupeeDisplay.vue";
import { getRupeeInnerValue, getRupeeOuterValue, getSentence, PossibleRupeeValue, Rupee, SentenceWord } from "@/models/Rupee";
import { CircleTheory } from "@/server/types"
import TranslationSentence from "./TranslationSentence.vue";

export default defineComponent({
  name: "RupeeSentence",
  components: {
    RupeeDisplay,
    TranslationSentence,
  },
  emits: ["select:rupee", "select:space", "select:text", "select:word"],
  props: {
    rupeeList: { type: Array as () => Array<PossibleRupeeValue>, required: true },
    style: { },
    circleTheory: { type: String as () => CircleTheory, required: true },
    width: { type: Number, default: 10 },
    linewidth: { type: Number, default: 2 },
    outerColor: { type: String, default: "black" },
    innerColor: { type: String, default: "black" },
    soundColor: { type: String, default: "magenta" },
    emptyColor: { type: String, default: "transparent" },
    selectedIndex: { type: Number, default: undefined },
    highlightOnHover: { type: Boolean, default: false },
    highlightSound: { type: Number, default: -1 },
    explodeRupee: { type: Boolean, default: false },
    useThresholdColors: { type: Boolean, default: false },
    useWordGuess: { type: Boolean, default: false },
    isWordMode: { type: Boolean, default: false },
    confidence: { type: Number, default: undefined },
    confidenceCatalog: { type: Object as () => Record<number, number>, required: true },
    soundCatalog: { type: Object as () => Record<number, string>, required: true },
    wordGuessCatalog: { type: Object as () => Record<number, string>, required: true },
    wordConfidenceCatalog: { type: Object as () => Record<number, number>, required: true },
    tooltipId: { type: Number, default: -1 },
  },
  computed: {
    groupedRupeeList(): Array<SentenceWord> {
      return getSentence(this.rupeeList);
    }
  },
  methods: {
    getRupeeFromRepresentation(representation: number): Rupee {
        return Rupee.fromRepresentation(representation);
    },
    getRupeeInnerRepresentaion(representation: number): Rupee {
        return Rupee.fromRepresentation(getRupeeInnerValue(representation));
    },
    getRupeeOuterRepresentaion(representation: number): Rupee {
        return Rupee.fromRepresentation(getRupeeOuterValue(representation, true));
    },
    shouldShowSecondRupee(representation: number): boolean {
      return getRupeeOuterValue(representation) != 0;
    },
    handleClick(item: PossibleRupeeValue, groupIndex: number, index: number, sentenceWord: SentenceWord) {
      if (typeof item === "number") {
        this.$emit("select:rupee", { rupee: item, groupIndex, index, sentenceWord });
      } else if (typeof item === "string") {
        this.$emit("select:text", { text: item, groupIndex, index, sentenceWord });
      } else {
        this.$emit("select:space", { index, groupIndex, sentenceWord });
      }
    },
    handleClickWord(sentenceWord: SentenceWord, groupIndex: number) {
      this.$emit("select:word", { sentenceWord, groupIndex });
    },
  },
});
</script>

<style scoped>
.sentence-display {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 4px;
}

.sentence-item {
  margin-bottom: auto;
  margin-top: auto;
  font-size: 24px;
}

.sentence-word-wrapper {
  display: inline-flex;
  flex-direction: column;
  margin-right: 8px; /* spacing between words */
  height: 100%;
  cursor: pointer;
}

.word-display {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
}

.text-block {
  height: 100%;
  font-family: monospace;
  border-radius: 4px;
  color: #333;
}

.gap-block {
  margin-top: auto;
  margin-bottom: auto;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  color: #aaa;
  font-size: 18px;
}

.sentence-item-wrapper {
  display: inline-flex;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.15s ease-in-out;
}

.sentence-display--highlight-hover .sentence-item-wrapper:hover {
  background-color: rgba(0, 0, 0, 0.1); /* soft gray highlight */
}

.sentence-item-wrapper.selected {
  background-color: rgba(100, 100, 255, 0.2); /* light blue for selected */
}
</style>
