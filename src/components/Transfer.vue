<template>
  <div class="p-4 space-y-6">
    <h2 class="text-xl font-bold">Sentence Export / Import</h2>

    <!-- Export Section -->
    <div>
      <h3 class="text-lg font-semibold">Export Sentences</h3>
      <mcw-button @click="fetchExistingSentences">Refresh</mcw-button>
      <mcw-button @click="exportSelectedSentences" :disabled="!selectedToExportIds?.length">Export Selected</mcw-button>

      <mcw-data-table>
        <table class="mdc-data-table__table">
          <thead>
            <tr class="mdc-data-table__header-row">
              <th>
                <mcw-checkbox v-model="selectAllExport" @change="toggleAllExport" />
              </th>
              <th>Title</th>
              <th>Page</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in existingSentences" :key="row.id">
              <td><mcw-checkbox v-model="selectedToExportIds" :value="row.id" /></td>
              <td>{{ row.title }}</td>
              <td>{{ row.page_number }}</td>
            </tr>
          </tbody>
        </table>
      </mcw-data-table>
    </div>

    <!-- Import Section -->
    <div>
      <h3 class="text-lg font-semibold">Import Sentences</h3>
      <input type="file" ref="fileInput" accept=".json" @change="handleFile" />
      <mcw-button @click="importSelectedSentences" :disabled="!selectedToImportIds.length">Import Selected</mcw-button>

      <mcw-data-table v-if="importedSentences.length">
        <table class="mdc-data-table__table">
          <thead>
            <tr>
              <th>
                <mcw-checkbox v-model="selectAllImport" @change="toggleAllImport" />
              </th>
              <th>Title</th>
              <th>Page</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in importedSentences" :key="index">
              <td><mcw-checkbox v-model="selectedToImportIds" :value="index" /></td>
              <td>{{ row.title }}</td>
              <td>{{ row.page_number }}</td>
            </tr>
          </tbody>
        </table>
      </mcw-data-table>
    </div>

    <p v-if="status" class="text-sm text-gray-600">{{ status }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { SentenceTransfer } from "@/server/types";

export default defineComponent({
  name: "SentenceExportImport",
  data() {
    return {
      existingSentences: [] as SentenceTransfer[],
      importedSentences: [] as SentenceTransfer[],
      selectedToExportIds: [] as number[],
      selectedToImportIds: [] as number[],
      selectAllExport: false,
      selectAllImport: false,
      status: "",
    };
  },
  mounted() {
    this.fetchExistingSentences();
  },
  methods: {
    async fetchExistingSentences() {
      const res = await fetch("/api/sentence");
      const data: SentenceTransfer[] = await res.json();
      this.existingSentences = data;
      this.selectedToExportIds = [];
      this.selectAllExport = false;
    },
    async exportSelectedSentences() {
      const selected = this.existingSentences.filter((s) =>
        this.selectedToExportIds.includes(s.id || -1)
      );

      const blob = new Blob([JSON.stringify(selected, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "sentences.json";
      link.click();
      URL.revokeObjectURL(url);

      this.status = `Exported ${selected.length} sentences.`;
    },
    toggleAllExport() {
      if (this.selectAllExport) {
        this.selectedToExportIds = this.existingSentences
          .map((s) => s.id!)
          .filter(Boolean);
      } else {
        this.selectedToExportIds = [];
      }
    },
    async handleFile(event: Event) {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as SentenceTransfer[];
        this.importedSentences = parsed;
        this.selectedToImportIds = [];
        this.selectAllImport = false;
        this.status = `Loaded ${parsed.length} sentences for import.`;
      } catch (err) {
        console.error(err);
        this.status = "Failed to parse file.";
      }
    },
    async importSelectedSentences() {
      const selected = this.selectedToImportIds.map(
        (i) => this.importedSentences[i]
      );

      try {
        console.log("TODO: Save sentences", selected);
        // Uncomment when endpoint is ready
        /*
        const res = await fetch("/api/sentence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selected),
        });

        if (res.ok) {
          this.status = `Imported ${selected.length} sentences.`;
          this.importedSentences = [];
          this.selectedToImportIds = [];
        } else {
          throw new Error("Failed to import");
        }
        */
      } catch (err) {
        console.error(err);
        this.status = "Import failed.";
      }
    },
    toggleAllImport() {
      if (this.selectAllImport) {
        this.selectedToImportIds = this.importedSentences.map((_, i) => i);
      } else {
        this.selectedToImportIds = [];
      }
    },
  },
});
</script>
