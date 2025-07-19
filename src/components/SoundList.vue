<template>
  <div style="display: flex;">
    <mcw-data-table class="sound-table" style="flex: 1;">
      <table class="mdc-data-table__table" aria-label="Sound Pieces">
        <thead>
          <tr class="mdc-data-table__header-row">
            <th class="mdc-data-table__header-cell">Piece</th>
            <th class="mdc-data-table__header-cell" @click="sortBy('sound')">Sound</th>
            <th class="mdc-data-table__header-cell" @click="sortBy('confidence')">Confidence</th>
            <th class="mdc-data-table__header-cell" @click="sortBy('comment')">Comment</th>
          </tr>
          <tr>
            <th></th>
            <th><input v-model="filters.sound" placeholder="Filter Sound" /></th>
            <th><input v-model="filters.confidence" placeholder="Filter Confidence" /></th>
            <th><input v-model="filters.comment" placeholder="Filter Comment" /></th>
          </tr>
        </thead>
        <tbody class="mdc-data-table__content">
          <tr 
            class="mdc-data-table__row"
            v-for="(row, index) in filteredAndSortedData"
            :key="index"
          >
            <teleport to="body">
              <mcw-tooltip
                :id="`tooltip-table-sound-${index}`"
                :persistent="true"
              >Id: {{ row.rupee.getRepresentation(false) }}, Type: {{ getRupeeType(row.rupee.getRepresentation(false)) }}</mcw-tooltip>
            </teleport>
            <td class="mdc-data-table__cell" :aria-describedby="`tooltip-table-sound-${index}`">
              <RupeeDisplay
                :rupee="row.rupee"
                :width="10"
                :linewidth="2"
                :is-interactive="false"
                :is-word="row.rupee.getRepresentation(false) === 0"
                empty-color="transparent"
                :inner-color="getColor(row.confidence)"
                :outer-color="getColor(row.confidence)"
                @update:rupee="row.rupee = $event"
                @click="selectRow(row)"
              />
            </td>
            <td class="mdc-data-table__cell has-editable">
              <input v-model="row.sound" class="editable-input" @blur="saveRow(row)" />
            </td>
            <td class="mdc-data-table__cell has-editable">
              <input type="number" v-model.number="row.confidence" class="editable-input" @blur="saveRow(row)" />
            </td>
            <td class="mdc-data-table__cell has-editable">
              <input v-model="row.comment" class="editable-input" @blur="saveRow(row)" />
            </td>
          </tr>
        </tbody>
      </table>
    </mcw-data-table>

    <mcw-dialog
      v-model="showSoundContext"
      escape-key-action="close"
      scrim-click-action="close"
      :scrollable="true"
      @mdcdialog:closing="selectedRow = null"
    >
      <mcw-dialog-title>Context</mcw-dialog-title>
      <mcw-dialog-content>
        <ul class="mdc-list">
          <li
            class="mdc-list-item"
            v-for="(soundUsage, i) in getSoundUsageList(selectedRow?.rupee)"
            :key="soundUsage.sentenceId"
            style="cursor: pointer"
          >
            <template
              v-for="(wordUsage, j) in soundUsage.usageList"
            >
              <teleport to="body">
                <mcw-tooltip
                  :id="`tooltip-sound-${soundUsage.sentenceId}-${i}-${j}`"
                  :persistent="true"
                >Id: {{ soundUsage.sentenceId }}, Words: {{ soundUsage.usageList?.length || 0 }}; {{ getSentence(wordUsage.word) }}</mcw-tooltip>
              </teleport>
              <div
                :aria-describedby="`tooltip-sound-${soundUsage.sentenceId}-${i}-${j}`"
              >
                <RupeeSentence
                  :rupee-list="wordUsage.word"
                  :highlight-on-hover="true"
                  :highlight-sound="soundUsage.soundId"
                  :circle-theory="circleTheory"
                  @select:rupee="goToUsage(soundUsage, wordUsage.wordStartIndex + $event.index)"
                />
              </div>
            </template>
          </li>
        </ul>
      </mcw-dialog-content>
    </mcw-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import RupeeDisplay from "./RupeeDisplay.vue";
import RupeeSentence from "./RupeeSentence.vue";
import { useRoute, useRouter } from "vue-router";
import { Sentence, SoundSentenceUsage, Sound, SoundType, CircleTheory } from "@/server/types";
import { getRupeeInnerValue, getRupeeOuterValue, getRupeeType, getTranslation, Rupee } from "@/models/Rupee";
import debounce from "lodash.debounce";

interface SoundRow {
  rupee: Rupee
  sound: string
  alternate_sounds: Array<string> // Not used yet
  confidence: number
  comment: string
};

interface SoundUsage {
  soundId: number
  sentenceId: number
  usageList: Array<SoundSentenceUsage>
}

export default defineComponent({
  name: "SoundList",
  components: {
    RupeeDisplay,
    RupeeSentence,
  },
  data() {
    return {
      tableData: [] as SoundRow[],
      soundCatalog: {} as Record<number, string>,
      soundSentenceCatalog: {} as Record<number, Record<number, Array<SoundSentenceUsage>>>, // {sound_id: {sentence_id: [usage]}}
      selectedRow: null as SoundRow | null,
      filters: {
        sound: "",
        confidence: "",
        comment: ""
      },
      sortKey: "" as keyof SoundRow | "",
      sortAsc: true,
      useThreholdColors: true,
      thresholdHigh: 80,
      thresholdLow: 30,
      showSoundContext: false,
      preSelectedIdRaw: "" as string,
    };
  },
  props: {
    circleTheory: { type: String as () => CircleTheory, required: true },
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    return { route, router };
  },
  created() {
    this.preSelectedIdRaw = `${this.route.params.id}`;
  },
  async mounted() {
    await this.loadData();

    if (this.preSelectedIdRaw) {
      const preSelectedId = parseInt(this.preSelectedIdRaw)
      if (!isNaN(preSelectedId)) {
        for (const row of this.tableData) {
          if (row.rupee.getRepresentation(false) === preSelectedId) {
            this.selectRow(row);
            break;
          }
        }
      }
    }
  },
  computed: {
    filteredAndSortedData(): SoundRow[] {
      let data = this.tableData.filter(row => {
        return (
          row.sound.toLowerCase().includes(this.filters.sound.toLowerCase()) &&
          row.comment.toLowerCase().includes(this.filters.comment.toLowerCase()) &&
          (this.filters.confidence === '' || row.confidence.toString().includes(this.filters.confidence))
        );
      });

      if (this.sortKey !== '') {
        const key = this.sortKey as keyof SoundRow;
        data = [...data].sort((a, b) => {
          const valA = a[key]
          const valB = b[key]
          return this.sortAsc
            ? valA > valB ? 1 : -1
            : valA < valB ? 1 : -1
        });
      }

      return data;
    }
  },
  methods: {
    async loadData(nestedLevel: number = 0): Promise<void> {
      let soundList: Sound[] = []
      try {
        const res = await fetch("/api/sound");
        soundList = await res.json();
        this.soundCatalog = Object.fromEntries(soundList.map(function(sound: Sound): [number, string] {
          return [sound.id, sound.guessed_sound];
        }));
        this.tableData = soundList.map(function(sound: Sound): SoundRow {
          return {
            rupee: Rupee.fromRepresentation(sound.id),
            sound: sound.guessed_sound,
            alternate_sounds: sound.alternate_guesses,
            confidence: sound.confidence,
            comment: sound.comment,
          }
        });
      } catch (err) {
        console.error("Failed to load soundList", err);
      }

      try {
        const res = await fetch("/api/sound-sentence-catalog");
        this.soundSentenceCatalog = await res.json();
      } catch (err) {
        console.error("Failed to load sentence usages", err);
      }

      console.log("Sounds:", {soundList, soundCatalog: this.soundCatalog, soundSentenceCatalog: this.soundSentenceCatalog, nestedLevel});

      if (nestedLevel > 1) {
        console.error("@loadData; Nested too deeply");
        return;
      }

      const shouldRefresh = await this.ensureSounds();
      if (shouldRefresh) {
        return this.loadData(nestedLevel + 1);
      }
    },
    saveRow: debounce(async function(row: SoundRow) {
      const id = row.rupee.getRepresentation(false);

      const payload = {
        id,
        type: getRupeeType(row.rupee.getRepresentation()),
        guessed_sound: row.sound,
        alternate_guesses: row.alternate_sounds,
        confidence: row.confidence,
        comment: row.comment
      };

      try {
        await fetch('/api/sound', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        console.log("Saved sound:", id);
      } catch (err) {
        console.error("Failed to save sound", id, err);
      }
    }, 500),
    sortBy(key: keyof SoundRow) {
      if (this.sortKey === key) {
        this.sortAsc = !this.sortAsc;
      } else {
        this.sortKey = key;
        this.sortAsc = true;
      }
    },
    selectRow(row: SoundRow) {
      console.log("@selectRow", row);
      this.selectedRow = row;
      this.showSoundContext = true;
    },
    getSoundUsageList(rupee?: Rupee): Array<SoundUsage> {
      if (!rupee) {
        return [];
      }

      const soundId = rupee.getRepresentation(false)
      const sentenceCatalog = this.soundSentenceCatalog[soundId];
      if (!sentenceCatalog) {
        return [];
      }

      return Object.entries(sentenceCatalog).map(function([sentenceIdRaw, usageList]): SoundUsage {
        return {
          soundId,
          sentenceId: parseInt(sentenceIdRaw),
          usageList: usageList,
        }
      });
    },
    goToUsage(usage: SoundUsage, index: number) {
      this.router.push(`/sentence-viewer/${usage.sentenceId}?pre-select=${index}`); // TODO: Pre-select the part of the word that has this sound
    },
    async ensureSounds(): Promise<boolean> {
      let foundMissing = false;
      const existingSounds = new Set(this.tableData.map((row) => row.rupee.getRepresentation(false)));
      for (const soundIdRaw in this.soundSentenceCatalog) {
        const soundId = parseInt(soundIdRaw);
        if (!existingSounds.has(soundId)) {
          foundMissing = true;
          console.log("Adding Missing sound:", soundId, existingSounds);

          await fetch('/api/sound', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: soundId,
              type: getRupeeType(soundId),
            }),
          });
        }
      }
      return foundMissing;
    },
    getRupeeType(representation: number): SoundType {
      return getRupeeType(representation);
    },
    getSentence(rupeeIdList: Array<number | string | null>): string {
      return getTranslation(this.soundCatalog, rupeeIdList, this.circleTheory)
    },
    getColor(confidence: number): string {
      if (!this.useThreholdColors) {
        return "black";
      }

      if (confidence > this.thresholdHigh) {
        return "green";
      }

      if (confidence > this.thresholdLow) {
        return "orange";
      }
      
      return "red";
    },
  }
})
</script>


<style scoped>
.editable-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 4px;
  font-size: 14px;
}

.mdc-data-table__cell.has-editable {
  text-overflow: unset;
}

.tooltip-wrapper {
  position: relative;
  cursor: pointer;
}
.tooltip-content:hover + .tooltip-text {
  display: block;
}
.tooltip-text {
  display: none;
  position: absolute;
  background-color: #333;
  color: white;
  padding: 5px;
  border-radius: 4px;
  top: 100%;
  left: 0;
  z-index: 10;
}
.context-drawer {
  width: 300px;
}
</style>