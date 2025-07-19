<template>
  <div class="p-4 space-y-2" style="display:flex; flex-direction: column;">
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
    <hr>
    <h3 class="font-semibold">Mechanics</h3>
    <mcw-select
      v-model="settings.circle_theory"
      :value="settings.circle_theory"
      label="Circle Theory"
    >
      <template
        v-for="key in circleTheoryOptions"
        :key="key"
      >
        <mcw-list-item
          :value="key"
          :data-value="key"
        >{{ key }}</mcw-list-item>
      </template>
    </mcw-select>
  </div>
  <div style="font-size: 12px; color: gray; margin-left: auto;">
    <span v-if="isSaving">Saving…</span>
    <span v-else-if="lastSaved">Last saved at {{ lastSaved.toLocaleTimeString() }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch } from "vue";
import debounce from "lodash.debounce";
import { CircleTheory, Settings, circleTheoryOptions } from "@/server/types";
import { PageInfo, pageInfoList, updatePageInfoList } from "@/models/PageInfo";

export default defineComponent({
  name: "PageCheckboxList",
  props: {
    pageInfoList: { type: Object as () => Record<string, PageInfo>, required: true },
    circleTheory: { type: String as () => CircleTheory, required: true }, // Needed so it does not pass it down further
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
    settings: {
      handler() {
        if (!this.canSave) {
          return; // Sill loading
        }
        this.debouncedSave();
      },
      deep: true,
    }
  },
  computed: {
    circleTheoryOptions() {
      return circleTheoryOptions;
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

