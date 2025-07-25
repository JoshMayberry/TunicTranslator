<template>
  <div class="sentence-display" :class="highlightOnHover ? 'sentence-display--highlight-hover' : ''" style="style">
    <template v-for="(rupeeId, index) in rupeeList" :key="index">
      <span
        class="sentence-item-wrapper"
        :class="{ selected: index === selectedIndex }"
        @click="() => handleClick(rupeeId, index)"
        :aria-describedby="(tooltipId !== -1) ?`tooltip-sentence-rupee-${tooltipId}-${index}` : ''"
      >
          <template v-if="typeof rupeeId == 'number'">
          <teleport to="body" v-if="(tooltipId !== -1)">
            <mcw-tooltip
              :id="`tooltip-sentence-rupee-${tooltipId}-${index}`"
              :persistent="true"
            >
              <span>{{ getSentence([rupeeId]) }}</span>
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
            :use-threhold-colors="useThreholdColors"
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
            :use-threhold-colors="useThreholdColors"
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
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import RupeeDisplay from "./RupeeDisplay.vue";
import { getRupeeInnerValue, getRupeeOuterValue, getTranslation, Rupee } from "@/models/Rupee";
import { CircleTheory } from "@/server/types"

export default defineComponent({
  name: "RupeeSentence",
  components: { RupeeDisplay },
  emits: ["select:rupee", "select:space", "select:text"],
  props: {
    rupeeList: { type: Array as () => Array<number | string | null>, required: true },
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
    useThreholdColors: { type: Boolean, default: false },
    confidenceCatalog: { type: Object as () => Record<number, number>, default: {} },
    soundCatalog: { type: Object as () => Record<number, string>, default: {} },
    tooltipId: { type: Number, default: -1 },
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
    handleClick(item: number | string | null, index: number) {
      if (typeof item === "number") {
        this.$emit("select:rupee", { rupee: item, index });
      } else if (typeof item === "string") {
        this.$emit("select:text", { text: item, index });
      } else {
        this.$emit("select:space", { index });
      }
    },
    getSentence(rupeeIdList: Array<number | string | null>): string {
      return getTranslation(this.soundCatalog, rupeeIdList, this.circleTheory)
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

.text-block {
  font-family: monospace;
  border-radius: 4px;
  color: #333;
}

.gap-block {
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
