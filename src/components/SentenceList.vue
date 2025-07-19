<template>
  <div style="display: flex;">
    <mcw-data-table class="sentence-table" style="flex: 1;">
      <table class="mdc-data-table__table" aria-label="Sentences">
        <thead>
          <tr class="mdc-data-table__header-row">
            <th class="mdc-data-table__header-cell" @click="sortBy('title')">Title</th>
            <th class="mdc-data-table__header-cell">Sentence</th>
            <th class="mdc-data-table__header-cell" @click="sortBy('confidence')">Confidence</th>
            <th class="mdc-data-table__header-cell" @click="sortBy('page_number')">Page</th>
            <th class="mdc-data-table__header-cell" @click="sortBy('comment')">Comment</th>
          </tr>
          <tr>
            <th><input v-model="filters.title" placeholder="Filter Title" /></th>
            <th></th>
            <th><input v-model="filters.confidence" placeholder="Filter Confidence" /></th>
            <th><input v-model="filters.page_number" placeholder="Filter Page" /></th>
            <th><input v-model="filters.comment" placeholder="Filter Comment" /></th>
          </tr>
        </thead>
        <tbody class="mdc-data-table__content">
          <tr 
            class="mdc-data-table__row"
            v-for="(row, index) in filteredAndSortedData"
            :key="index"
          >
            <td class="mdc-data-table__cell has-editable">
              <input v-model="row.title" class="editable-input" @blur="saveRow(row)" />
            </td>
            <td class="mdc-data-table__cell" :aria-describedby="`tooltip-table-sentence-${index}`">
              <teleport to="body">
                <mcw-tooltip
                  :id="`tooltip-table-sentence-${index}`"
                  :persistent="true"
                  class="sentence-tooltip"
                >
                  <span>{{ getSentence(row.word_list) }}</span>
                  <template v-if="row.translation">
                    <hr>
                    <span>{{ row.translation }}</span>
                  </template>
                  <ImageOverlayEditor
                    v-if="row.page_number && row.page_overlay?.height && pageInfoList[row.page_number]?.imagePath && pageInfoList[row.page_number]?.isFound"
                    :src="pageInfoList[row.page_number].imagePath || ''"
                    :overlay="row.page_overlay"
                    :apply-overlay-mask="true"
                    style="max-width: 100%; margin-top: 1rem;"
                  />
                </mcw-tooltip>
              </teleport>
              <RupeeSentence
                :rupee-list="row.word_list"
                :use-threhold-colors="useThresholdColors"
                :confidence-catalog="confidenceCatalog"
                @click="selectRow(row)"
              />
            </td>
            <td class="mdc-data-table__cell has-editable">
              <input type="number" v-model.number="row.confidence" class="editable-input" @blur="saveRow(row)" />
            </td>
            <td class="mdc-data-table__cell has-editable">
              <input v-model="row.page_number" class="editable-input" @blur="saveRow(row)" />
            </td>
            <td class="mdc-data-table__cell has-editable">
              <input v-model="row.comment" class="editable-input" @blur="saveRow(row)" />
            </td>
          </tr>
        </tbody>
      </table>
    </mcw-data-table>
    <mcw-button to="/sentence-viewer">+</mcw-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import RupeeSentence from "./RupeeSentence.vue";
import ImageOverlayEditor from "./ImageOverlayEditor.vue";
import { useRouter } from "vue-router";
import { PageOverlay, Sentence } from "@/server/sentence";
import debounce from "lodash.debounce";
import { Sound } from "@/server/sound";
import { getRupeeInnerValue, getRupeeOuterValue, getTranslation } from "@/models/Rupee";
import { PageInfo } from "@/models/PageInfo";

interface SentenceRow {
  id: number
  title: string
  word_list: Array<number | string | null>
  translation: string
  confidence: number
  picture: string
  page_number: string
  page_overlay: PageOverlay
  comment: string
};

export default defineComponent({
  name: "SentenceList",
  components: {
    RupeeSentence,
    ImageOverlayEditor,
  },
  props: {
    pageInfoList: { type: Object as () => Record<string, PageInfo>, required: true },
  },
  data() {
    return {
      tableData: [] as SentenceRow[],
      filters: {
        title: "",
        confidence: "",
        comment: "",
        page_number: "",
      },
      sortKey: "" as keyof SentenceRow | "",
      sortAsc: true,
      confidenceCatalog: {} as Record<number, number>,
      router: useRouter(),
      soundCatalog: {} as Record<number, string>,
      useThresholdColors: true as boolean,
    };
  },
  async mounted() {
    await this.loadData();
  },
  computed: {
    filteredAndSortedData(): SentenceRow[] {
      let data = this.tableData.filter(row => {
        return (
          row.title.toLowerCase().includes(this.filters.title.toLowerCase()) &&
          row.comment.toLowerCase().includes(this.filters.comment.toLowerCase()) &&
          (this.filters.confidence === '' || row.confidence.toString().includes(this.filters.confidence))
        );
      });

      if (this.sortKey !== '') {
        const key = this.sortKey as keyof SentenceRow;
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
        let res = await fetch("/api/sound");
        const soundList = await res.json();
        this.soundCatalog = Object.fromEntries(soundList.map(function(sound: Sound): [number, string] {
          return [sound.id, sound.guessed_sound];
        }));
        this.confidenceCatalog = Object.fromEntries(soundList.map(function(sound: Sound): [number, number] {
          return [sound.id, sound.confidence];
        }));

        res = await fetch('/api/sentence');
        const sentenceList: Sentence[] = await res.json();
        console.log("Sentences:", sentenceList);
        this.tableData = sentenceList.map(function(sentence: Sentence): SentenceRow {
          return {
            id: sentence.id || -1,
            title: sentence.title,
            word_list: sentence.word_list,
            translation: sentence.translation,
            confidence: sentence.confidence,
            picture: sentence.picture,
            page_number: sentence.page_number,
            page_overlay: sentence.page_overlay,
            comment: sentence.comment,
          }
        });
      } catch (err) {
        console.error('Failed to load sentences', err);
      }
    },
    saveRow: debounce(async function(row: SentenceRow) {
      const payload = {
        id: row.id,
        title: row.title,
        word_list: row.word_list,
        translation: row.translation,
        confidence: row.confidence,
        picture: row.picture,
        page_number: row.page_number,
        page_overlay: row.page_overlay,
        comment: row.comment,
      };

      try {
        await fetch('/api/sentence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        console.log("Saved sentence:", row.id);
      } catch (err) {
        console.error("Failed to save sentence", row.id, err);
      }
    }, 500),
    sortBy(key: keyof SentenceRow) {
      if (this.sortKey === key) {
        this.sortAsc = !this.sortAsc;
      } else {
        this.sortKey = key;
        this.sortAsc = true;
      }
    },
    selectRow(row: SentenceRow) {
      this.router.push(`/sentence-viewer/${row.id}`);
    },
    getSentence(rupeeIdList: Array<number | string | null>): string {
      return getTranslation(this.soundCatalog, rupeeIdList)
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

<style>
.sentence-tooltip .mdc-tooltip__surface {
  max-width: 50vw;
}
</style>