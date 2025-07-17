<template>
  <div class="sentence-display" :class="highlightOnHover ? 'sentence-display--highlight-hover' : ''" style="style">
    <template v-for="(item, index) in rupeeList" :key="index">
      <span
        class="sentence-item-wrapper"
        :class="{ selected: index === selectedIndex }"
        @click="() => handleClick(item, index)"
      >
        <template v-if="typeof item == 'number'">
          <RupeeDisplay
            :rupee="explodeRupee ? getRupeeInnerRepresentaion(item) : getRupeeFromRepresentation(item)"
            :width="width"
            :linewidth="linewidth"
            :is-interactive="false"
            :outer-color="outerColor"
            :inner-color="innerColor"
            :empty-color="emptyColor"
            :use-threhold-colors="useThreholdColors"
            :confidence-catalog="confidenceCatalog"
            :is-debug="false"
            :is-word="true"
            class="sentence-item"
          />
          <RupeeDisplay
            v-if="explodeRupee && shouldShowSecondRupee(item)"
            :rupee="explodeRupee ? getRupeeOuterRepresentaion(item) : getRupeeFromRepresentation(item)"
            :width="width"
            :linewidth="linewidth"
            :is-interactive="false"
            :outer-color="outerColor"
            :inner-color="innerColor"
            :empty-color="emptyColor"
            :use-threhold-colors="useThreholdColors"
            :confidence-catalog="confidenceCatalog"
            :is-debug="false"
            :is-word="true"
            class="sentence-item"
          />
        </template>
        <span v-else-if="typeof item === 'string'" class="text-block sentence-item">{{ item }}</span>
        <span v-else class="gap-block sentence-item"> </span>
      </span>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import RupeeDisplay from "./RupeeDisplay.vue";
import { getRupeeInnerValue, getRupeeOuterValue, Rupee } from "@/models/Rupee";

export default defineComponent({
  name: "RupeeSentence",
  components: { RupeeDisplay },
  emits: ["select:rupee", "select:space", "select:text"],
  props: {
    rupeeList: {
      type: Array as () => Array<number | string | null>,
      required: true,
    },
    style: { },
    width: { type: Number, default: 10 },
    linewidth: { type: Number, default: 2 },
    outerColor: { type: String, default: "black" },
    innerColor: { type: String, default: "black" },
    emptyColor: { type: String, default: "transparent" },
    selectedIndex: { type: Number, default: undefined },
    highlightOnHover: { type: Boolean, default: false },
    explodeRupee: { type: Boolean, default: false },
    useThreholdColors: { type: Boolean, default: false },
    confidenceCatalog: { type: Object as () => Record<number, number>, default: {} },
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
