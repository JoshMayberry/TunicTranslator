<template>
  <div class="p-4 space-y-4">
    <AppBar />
    <NavigationBar class="mdc-top-app-bar--fixed-adjust" />
    
    <main class="p-4">
      <router-view :page-info-list="pageInfoListRef" />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppBar from './components/AppBar.vue';
import NavigationBar from './components/NavigationBar.vue';
import { onMounted, ref } from 'vue'
import { Settings } from './server/settting';
import { PageInfo, pageInfoList, updatePageInfoList } from './models/PageInfo';
// import { loadWords, loadSentences, loadSymbols } from './services/api'
// import SaveAllPending from './components/SaveAllPending.vue'
// import { autoSync } from './stores/settings'

const pageInfoListRef = ref<Record<string, PageInfo>>({})


onMounted(async () => {

      try {
        const res = await fetch("/api/setting");
        const data = await res.json();

        const filledPages: Record<string, boolean> = {};
        for (const pageInfo of Object.values(pageInfoList)) {
          filledPages[pageInfo.number] = data.found_pages?.[pageInfo.number] || false;
        }

        const settings: Settings = {
          ...data,
          found_pages: filledPages,
        };

        pageInfoListRef.value = updatePageInfoList(settings.found_pages);
      } catch (err) {
        console.error("Failed to load settings", err);
      }


  // const res = await fetch('/api/symbols')
  // console.log("@1", res)
  // const symbols = await res.text()
  // console.log("@2", symbols)


//   words.value = await loadWords()
//   sentences.value = await loadSentences()
//   symbols.value = await loadSymbols()
})
</script>