<template>
  <div class="p-4 space-y-2">
    <h3 class="font-semibold">Pages Found</h3>

    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      <div
        v-for="pageInfo of pageInfoList"
        :key="pageInfo.number"
        class="flex items-center space-x-2"
      >
        <mcw-checkbox
          :id="`page-info-${pageInfo.number}`"
          v-model="settings.found_pages[pageInfo.number]"
          :value="pageInfo.number"
        />
        <label :for="`page-info-${pageInfo.number}`">{{ pageInfo.label }}</label>
      </div>
    </div>
  </div>
  <div style="font-size: 12px; color: gray; margin-left: auto;">
    <span v-if="isSaving">Saving…</span>
    <span v-else-if="lastSaved">Last saved at {{ lastSaved.toLocaleTimeString() }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch } from "vue";
import debounce from "lodash.debounce";
import { Settings } from "@/server/settting";
import { PageInfo, pageInfoList, updatePageInfoList } from "@/models/PageInfo";

export default defineComponent({
  name: "PageCheckboxList",
  props: {
    pageInfoList: { type: Object as () => Record<string, PageInfo>, required: true },
  },
  data() {
    return {
      settings: {
        found_pages: {} as Record<string, boolean>,
      } as Settings,
      isSaving: false as Boolean,
      lastSaved: undefined as Date | undefined,
      canSave: false as Boolean,
      debouncedSave: () => {},
    };
  },
  created() {
    this.loadData();
    this.debouncedSave = debounce(this.saveSettings, 500);

    setTimeout(() => {
      this.canSave = true;
    }, 1000);
  },
  watch: {
    'settings.found_pages': {
      handler() {
        if (!this.canSave) {
          return; // Sill loading
        }
        this.debouncedSave();
      },
      deep: true,
    }
  },
  methods: {
    async loadData() {
      try {
        const res = await fetch("/api/setting");
        const data = await res.json();

       const filledPages: Record<string, boolean> = {};
        for (const pageInfo of Object.values(pageInfoList)) {
          filledPages[pageInfo.number] = data.found_pages?.[pageInfo.number] || false;
        }

        this.settings = {
          ...data,
          found_pages: filledPages,
        };
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    },
    async saveSettings() {
      if (!this.canSave) {
        return; // Sill loading
      }
      updatePageInfoList(this.settings.found_pages);
      try {
        this.isSaving = true;
        await fetch("/api/setting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.settings),
        });
        this.lastSaved = new Date();
        console.log("Settings saved");
      } catch (err) {
        console.error("Failed to save settings", err);
      } finally {
        this.isSaving = false;
      }
    },
  },
});
</script>

