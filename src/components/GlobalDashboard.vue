<template>
  <div class="p-4 bg-white rounded shadow space-y-4">
    <h2 class="text-xl font-bold">Metrics Dashboard</h2>

    <div class="p-4 bg-gray-50 rounded shadow">
      <h3 class="font-semibold">Average Confidence</h3>
      <p class="text-2xl">{{ metrics.averageConfidence?.toFixed(1) }}</p>
    </div>

    <div class="p-4 bg-gray-50 rounded shadow">
      <h3 class="font-semibold">Total Sentences</h3>
      <p class="text-2xl">{{ metrics.totalSentences }}</p>
    </div>

    <div class="p-4 bg-gray-50 rounded shadow">
      <h3 class="font-semibold">Total Sounds Used</h3>
      <p class="text-2xl">{{ metrics.totalSounds }}</p>
    </div>

    <div class="p-4 bg-gray-50 rounded shadow">
      <h3 class="font-semibold mb-2">Top Sounds</h3>
      <ul class="space-y-1">
        <li
          v-for="(s, i) in metrics.mostUsedSounds"
          :key="s.soundId"
          class="flex justify-between"
        >
          <div style="display: flex; flex-direction: row;">
            <RupeeSentence
              :tooltip-id="i"
              :rupee-list="[s.soundId]"
              :confidence-catalog="confidenceCatalog"
              :sound-catalog="soundCatalog"
              :circle-theory="circleTheory"
              :use-word-guess="useWordGuess"
              :word-guess-catalog="wordGuessCatalog"
              :word-confidence-catalog="wordConfidenceCatalog"
            />
            <span class="font-mono" style="margin-top: auto; margin-bottom: auto;">: {{ s.count }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { Sentence, SoundSentenceUsage, Sound, CircleTheory, Word } from "@/server/types";
import { defineComponent } from "vue";
import RupeeSentence from './RupeeSentence.vue';
import TranslationSentence from "./TranslationSentence.vue";

interface Metrics {
  averageConfidence: number;
  totalSentences: number;
  totalSounds: number;
  mostUsedSounds: { soundId: number; count: number }[];
}

export default defineComponent({
  name: "Dashboard",
  components: {
    RupeeSentence,
    TranslationSentence,
  },
  data() {
    return {
      loading: true,
      useWordGuess: false,
      error: "",
      metrics: {} as Metrics,
      soundList: [] as Sound[],
      sentenceList: [] as Sentence[],
      soundSentenceCatalog: {} as Record<number, Record<number, Array<SoundSentenceUsage>>>, // {sound_id: {sentence_id: [usage]}}
      confidenceCatalog: {} as Record<number, number>,
      soundCatalog: {} as Record<number, string>,
      wordGuessCatalog: {} as Record<string, string>,
      wordConfidenceCatalog: {} as Record<string, number>,
    };
  },
  props: {
    circleTheory: { type: String as () => CircleTheory, required: true },
  },
  async mounted() {
    await this.loadData();
    this.computeMetrics();
  },
  methods: {
    async loadData() {
      let res = await fetch("/api/sound");
      this.soundList = await res.json();
      
      this.soundCatalog = Object.fromEntries(this.soundList.map(function(sound: Sound): [number, string] {
        return [sound.id, sound.guessed_sound];
      }));
      this.confidenceCatalog = Object.fromEntries(this.soundList.map(function(sound: Sound): [number, number] {
        return [sound.id, sound.confidence];
      }));

      res = await fetch("/api/word");
      const wordList = await res.json();
      this.wordGuessCatalog = Object.fromEntries(wordList.map(function(word: Word): [string, string] {
        return [word.combined_ids, word.meaning];
      }));
      this.wordConfidenceCatalog = Object.fromEntries(wordList.map(function(word: Word): [string, number] {
        return [word.combined_ids, word.confidence];
      }));

      res = await fetch('/api/sentence');
      this.sentenceList = await res.json();
      
      res = await fetch("/api/sound-sentence-catalog");
      this.soundSentenceCatalog = await res.json();
    },
    computeMetrics() {
      const totalSentences = this.sentenceList.length;

      const confidences = this.soundList.map(s => s.confidence);
      const averageConfidence = confidences.length
        ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
        : 0;

      const soundUsageMap: Record<number, number> = {};

      for (const [soundIdStr, sentenceMap] of Object.entries(this.soundSentenceCatalog)) {
        const soundId = Number(soundIdStr);
        let totalUses = 0;

        for (const usageList of Object.values(sentenceMap)) {
          totalUses += usageList.length;
        }

        soundUsageMap[soundId] = totalUses;
      }

      const totalSounds = Object.keys(soundUsageMap).length;

      const mostUsedSounds = Object.entries(soundUsageMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([soundId, count]) => ({ soundId: Number(soundId), count }));

      this.metrics = {
        totalSentences,
        averageConfidence,
        totalSounds,
        mostUsedSounds,
      };
    }
  },
});
</script>
