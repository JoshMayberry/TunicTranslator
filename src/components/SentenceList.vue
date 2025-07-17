<template>
  <div style="display: flex;">
    <mcw-data-table class="sentence-table" style="flex: 1;">
      <table class="mdc-data-table__table" aria-label="Sentences">
        <thead>
          <tr class="mdc-data-table__header-row">
            <th class="mdc-data-table__header-cell" @click="sortBy('title')">Title</th>
            <th class="mdc-data-table__header-cell">Sentence</th>
            <th class="mdc-data-table__header-cell" @click="sortBy('confidence')">Confidence</th>
            <th class="mdc-data-table__header-cell" @click="sortBy('comment')">Comment</th>
          </tr>
          <tr>
            <th><input v-model="filters.title" placeholder="Filter Title" /></th>
            <th></th>
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
            <td class="mdc-data-table__cell has-editable">
              <input v-model="row.title" class="editable-input" @blur="saveRow(row)" />
            </td>
            <td class="mdc-data-table__cell">
              <RupeeSentence
                :rupee-list="row.word_list"
                @click="selectRow(row)"
              />
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
    <mcw-button to="/sentence-viewer">+</mcw-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import RupeeSentence from "./RupeeSentence.vue";
import { useRouter } from "vue-router";
import { Sentence } from "@/server/sentence";
import debounce from "lodash.debounce";

interface SentenceRow {
  id: number
  title: string
  word_list: Array<number | string | null>
  translation: string
  confidence: number
  picture: string
  comment: string
};

export default defineComponent({
  name: "SentenceList",
  components: {
    RupeeSentence
  },
  data() {
    return {
      tableData: [] as SentenceRow[],
      filters: {
        title: "",
        confidence: "",
        comment: ""
      },
      sortKey: "" as keyof SentenceRow | "",
      sortAsc: true,
      router: useRouter(),
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
        const res = await fetch('/api/sentence');
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