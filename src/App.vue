<template>
  <div class="p-4 space-y-4">
    <AppBar />
    <NavigationBar class="mdc-top-app-bar--fixed-adjust" />
    
    <main class="p-4">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppBar from './components/AppBar.vue';
import NavigationBar from './components/NavigationBar.vue';
import { onMounted, ref } from 'vue'
// import { loadWords, loadSentences, loadSymbols } from './services/api'
// import SaveAllPending from './components/SaveAllPending.vue'
// import { autoSync } from './stores/settings'


onMounted(async () => {
  // const res = await fetch('/api/symbols')
  // console.log("@1", res)
  // const symbols = await res.text()
  // console.log("@2", symbols)


//   words.value = await loadWords()
//   sentences.value = await loadSentences()
//   symbols.value = await loadSymbols()
})
</script>