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
            <td class="mdc-data-table__cell">
              <RupeeDisplay
                :rupee="row.rupee"
                :width="10"
                :linewidth="2"
                :is-interactive="false"
                empty-color="transparent"
                inner-color="black"
                outer-color="black"
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
            v-for="(word, i) in getWordsForRupee(selectedRow?.rupee)"
            :key="word.id"
            @click="goToWord(word)"
            style="cursor: pointer"
          >
          <teleport to="body">
            <mcw-tooltip
              :id="`tooltip-sound-${word.id}-${i}`"
              :persistent="true"
            >{{ word.info }}</mcw-tooltip>
          </teleport>
            <span :aria-describedby="`tooltip-sound-${word.id}-${i}`">{{ word.text }}</span>
          </li>
        </ul>
      </mcw-dialog-content>
    </mcw-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import RupeeDisplay from "./RupeeDisplay.vue";
import { useRouter } from "vue-router";
import { Sound } from "@/server/sound";
import { Rupee } from "@/models/Rupee";
import debounce from "lodash.debounce";

interface SoundRow {
  rupee: Rupee
  sound: string
  alternate_sounds: Array<string> // Not used yet
  confidence: number
  comment: string
};

export default defineComponent({
  name: "SoundList",
  components: {
    RupeeDisplay
  },
  data() {
    return {
      tableData: [] as SoundRow[],
      selectedRow: null as SoundRow | null,
      filters: {
        sound: "",
        confidence: "",
        comment: ""
      },
      sortKey: "" as keyof SoundRow | "",
      sortAsc: true,
      showSoundContext: false,
    };
  },
  async mounted() {
    await this.loadData();
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
    async loadData() {
      try {
        const res = await fetch('/api/sound');
        const soundList: Sound[] = await res.json();
        console.log("Sounds:", soundList);

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
        console.error('Failed to load soundList', err);
      }
    },
    saveRow: debounce(async function(row: SoundRow) {
      const id = row.rupee.representation(false);

      const payload = {
        id,
        type: row.rupee.getType(),
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
      console.log("@selectRow", this);
      this.selectedRow = row;
      this.showSoundContext = true;
    },
    getWordsForRupee(rupee?: Rupee) {
      if (!rupee) {
        return;
      }

      // TODO: Gets called often, so needs a cache

      // Mock data
      return [
        { id: 1, text: "mystery", info: "Appears in 3 phrases" },
        { id: 2, text: "language", info: "Appears in 1 phrase" }
      ];
    },
    goToWord(word: any) {
      const router = useRouter();
      router.push(`/sentence-viewer/${word.id}`);
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