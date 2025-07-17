<template>
  <div style="display: flex; flex-direction: column;">
    <mcw-textfield
      v-model="sentence.title"
      class="title-box"
    />
    <div style="display: flex; flex-direction: row; flex: 1;">
      <div style="display: flex; flex-direction: column; flex:1;">
        <RupeeSentence
          style="flex:2"
          :rupee-list="sentence.word_list"
          :selected-index="selectedRupeeIndex"
          :highlight-on-hover="true"
          :explode-rupee="explodeRupee"
          :use-threhold-colors="useThreholdColors"
          :confidence-catalog="confidenceCatalog"
          @select:rupee="onRupeeClick"
          @select:text="onTextClick"
          @select:space="onSpaceClick"
        />
        <mcw-textfield
          v-model="directTranslation"
          class="translation-box"
          label="DirectTranslation"
          multiline
          aria-readonly="true"
          aria-disabled="true"
          readonly
          disabled
        />
        <mcw-textfield
          v-model="sentence.translation"
          class="translation-box"
          label="Translation"
          multiline
        />
        <mcw-textfield
          v-model="sentence.comment"
          class="translation-box"
          label="comment"
          multiline
        />
        <div style="display: flex; flex-direction: row;">
          <mcw-select
            v-model="sentence.page_number"
            :value="sentence.page_number"
            label="Page"
            helptext="What page this was on"
          >
            <mcw-list-item
              v-for="(page, key) in pageList"
              :key="key"
              :value="key"
              :data-value="key"
            >{{ page.label || key }}</mcw-list-item>
          </mcw-select>
          <img
            v-if="sentence.page_number && pageList[sentence.page_number]?.imagePath"
            :src="pageList[sentence.page_number].imagePath"
            alt="Page image"
            style="max-width: 100%; margin-top: 1rem;"
          />
        </div>
      </div>
      <div style="display: flex; flex-direction: column;">
        <RupeeDisplay
          v-if="selectedRupee"
          :rupee="selectedRupee"
          style="flex:1"
          :is-word="false"
          :is-debug="showDebugValue"
          :disabled="!selectedRupee"
          @update:rupee="onUpdateRupee($event)"
          :use-threhold-colors="useThreholdColors"
          :confidence-catalog="confidenceCatalog"
        ></RupeeDisplay>
        <mcw-textfield
          v-if="typeof selectedRupeeValue === 'string'"
          v-model="rupeePlainText"
          class="title-box"
        />
        <mcw-button @click="explodeRupee = !explodeRupee">Toggle<br>Explode</mcw-button>
        <mcw-button @click="onDeselect" :disabled="selectedRupeeIndex === undefined">Deselect</mcw-button>
        <mcw-button @click="onAddRupee">Add Rupee</mcw-button>
        <mcw-button @click="onAddSpace">Add Space</mcw-button>
        <mcw-button @click="onAddText">Add Text</mcw-button>
        <div style="display: flex; margin-left: auto; margin-right: auto;">
          <mcw-button @click="onMove(true)" :disabled="selectedRupeeIndex === undefined"><-</mcw-button>
          <mcw-button @click="onMove(false)" :disabled="selectedRupeeIndex === undefined">-></mcw-button>
        </div>
        <mcw-button @click="onRemove" :disabled="selectedRupeeIndex === undefined">Remove</mcw-button>
      </div>
    </div>
  </div>
  <div style="font-size: 12px; color: gray; margin-left: auto;">
    <span v-if="isSaving">Saving…</span>
    <span v-else-if="lastSaved">Last saved at {{ lastSaved.toLocaleTimeString() }}</span>
  </div>

  <mcw-snackbar-queue
    ref="snackbarQueue"
    v-model:snack="snackbarNextMessage"
  />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRoute, useRouter } from "vue-router";
import RupeeDisplay from './RupeeDisplay.vue';
import RupeeSentence from './RupeeSentence.vue';
import { getRupeeInnerValue, getRupeeOuterValue, Rupee } from "@/models/Rupee";
import debounce from "lodash.debounce";
import { Sentence } from "@/server/sentence";
import { Sound } from "@/server/sound";
import { PageInfo, pageInfoList } from "@/models/PageInfo";

const testSentence: Sentence = {
  id: undefined,
  title: "test",
  word_list: [123, 7289, 8, null, 2, "lorem ipsum", 73, 83],
  translation: "lorem ipsum dolor sit amet",
  confidence: 30,
  picture: "",
  page_number: "54",
  comment: "lorem ipsum",
  tags: ["lorem", "ipsum"],
};

export default defineComponent({
  name: "SentenceViewer",
  components: {
    RupeeDisplay,
    RupeeSentence,
  },
  props: {
    showDebugValue: {
      type: Boolean,
      default: true,
    },
  },
  data(): {
      sentence: Sentence,
      selectedRupeeIndex?: number,
      snackbarShow: boolean,
      snackbarMessage: string,
      snackbarNextMessage: any,
      rupeePlainText: string,
      debouncedSave: Function,
      isSaving: boolean,
      lastSaved: Date | null,
      canSave: boolean,
      explodeRupee: boolean,
      soundCatalog: Record<number, string>,
      confidenceCatalog: Record<number, number>,
      useThreholdColors: boolean,
    } {
    return {
      sentence: testSentence,
      rupeePlainText: "dolor sit",
      selectedRupeeIndex: 2,
      snackbarShow: false,
      snackbarMessage: "lorem ipsum",
      snackbarNextMessage: {},
      debouncedSave: () => {},
      isSaving: false,
      lastSaved: null,
      canSave: false,
      explodeRupee: false,
      soundCatalog: {},
      confidenceCatalog: {},
      useThreholdColors: true,
    };
  },
  computed: {
    selectedRupeeValue() {
      if (this.selectedRupeeIndex === undefined) {
        return undefined;
      }
      return this.sentence.word_list[this.selectedRupeeIndex];
    },
    selectedRupee() {
      if (typeof this.selectedRupeeValue === "number") {
        return Rupee.fromRepresentation(this.selectedRupeeValue);
      }
    }, 
    directTranslation(): string {
      return this.getSentence(this.sentence.word_list);
    },
    pageList() {
      return pageInfoList;
    },
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    return { route, router };
  },
  async created() {
    this.debouncedSave = debounce(this.saveSentence, 500);

    const idParam = this.route.params.id;
    const preSelectParam = this.route.query["pre-select"];
    this.selectedRupeeIndex = preSelectParam && !isNaN(Number(preSelectParam as string))
      ? Number(preSelectParam)
      : undefined;

    if (idParam && !isNaN(Number(idParam))) {
      const id = Number(idParam);
      try {
        const res = await fetch(`/api/sentence/${id}`);
        const sentence = await res.json();
        this.sentence = sentence;
      } catch (err) {
        console.error(err);
        this.showAlert("Could not load sentence with id " + id);
      }
    } else {
      // New sentence mode
      this.sentence = {
        id: undefined,
        title: "",
        word_list: [],
        translation: "",
        confidence: 0,
        picture: "",
        page_number: "n/a",
        comment: "",
        tags: []
      };
    }

    this.$nextTick(() => {
      this.canSave = true;
    });
  },
  async mounted() {
    const res = await fetch("/api/sound");
    const soundList = await res.json();
    this.soundCatalog = Object.fromEntries(soundList.map(function(sound: Sound): [number, string] {
      return [sound.id, sound.guessed_sound];
    }));
    this.confidenceCatalog = Object.fromEntries(soundList.map(function(sound: Sound): [number, number] {
      return [sound.id, sound.confidence];
    }));
  },
  watch: {
    rupeePlainText(val: string) {
      console.log("rupeePlainText updated:", this.selectedRupeeIndex, val)
      if (
        this.selectedRupeeIndex !== undefined &&
        typeof this.sentence.word_list[this.selectedRupeeIndex] === "string"
      ) {
        this.sentence.word_list[this.selectedRupeeIndex] = val;
      }
    },
    selectedRupeeValue: {
      immediate: true,
      handler(val) {
        if (typeof val === "string") {
          this.rupeePlainText = val;
        }
      }
    },
    sentence: {
      handler() {
        if (!this.canSave) {
          return; // Sill loading
        }
        this.debouncedSave();
      },
      deep: true
    },
  },
  methods: {
    onDeselect() {
      this.selectedRupeeIndex = undefined;
    },
    onAddRupee() {
      const newRupee = Rupee.fromRepresentation(0).getRepresentation(true);
      const i = this.selectedRupeeIndex ?? this.sentence.word_list.length;
      this.sentence.word_list.splice(i + 1, 0, newRupee);
      this.selectedRupeeIndex = i + 1;
    },
    onAddSpace() {
      const i = this.selectedRupeeIndex ?? this.sentence.word_list.length;
      this.sentence.word_list.splice(i + 1, 0, null);
      this.selectedRupeeIndex = i + 1;
    },
    onAddText() {
      const text = "text";
      const i = this.selectedRupeeIndex ?? this.sentence.word_list.length;
      this.sentence.word_list.splice(i + 1, 0, text);
      this.selectedRupeeIndex = i + 1;
    },
    onRemove() {
      if (this.selectedRupeeIndex === undefined) {
        this.showAlert("Nothing selected to remove");
        return;
      }
      this.sentence.word_list.splice(this.selectedRupeeIndex, 1);
      this.selectedRupeeIndex = undefined;
    },
    onMove(goLeft: boolean) {
      const i = this.selectedRupeeIndex;
      if (i === undefined) {
        this.showAlert("Nothing selected to move")
        return;
      }

      const j = goLeft ? i - 1 : i + 1;
      if (j < 0 || j >= this.sentence.word_list.length) return;

      const temp = this.sentence.word_list[i];
      this.sentence.word_list[i] = this.sentence.word_list[j];
      this.sentence.word_list[j] = temp;
      this.selectedRupeeIndex = j;
    },
    onUpdateRupee(rupee: Rupee) {
      if (this.selectedRupeeIndex === undefined) {
        this.showAlert("Nothing selected to update");
        return;
      }
      this.sentence.word_list[this.selectedRupeeIndex] = rupee.getRepresentation(true)
    },
    onRupeeClick({ rupee, index }: {rupee: Rupee, index: number}) {
      this.selectedRupeeIndex = index;
    },
    onTextClick({ text, index }: {text: string, index: number}) {
      this.selectedRupeeIndex = index;
    },
    onSpaceClick({ index }: { index: number }) {
      this.selectedRupeeIndex = index;
    },
    showAlert(message: string) {
      if (!this.$refs.snackbarQueue) {
        return;
      }

      this.snackbarShow = !this.snackbarShow;
      
      (this.$refs.snackbarQueue as any).handleSnack({
        message,
        timeoutMs: 5000,
        stacked: true,
      });
    },
    async saveSentence() {
      if (!this.canSave) {
        return; // Sill loading
      }
      try {
        this.isSaving = true;
        const res = await fetch("/api/sentence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.sentence)
        });

        if (res.status !== 200) {
          console.error(res)
          throw new Error(res.statusText);
        }

        const result = await res.json();
        this.lastSaved = new Date();
        if (this.sentence.id === undefined) {
          this.sentence.id = result.id;
        }
        
        if (this.sentence.id === undefined) {
          this.sentence.id = result.id;
          this.router.replace({ path: `/sentence/${result.id}` }); // shallow update
        }

      } catch (err) {
        console.error("Failed to save sentence:", err);
        this.showAlert("Error saving sentence");
      } finally {
        this.isSaving = false;
      }
    },
    getSentence(rupeeIdList: Array<number | string | null>): string {
      let answer = "";
      for (const rupeeId of rupeeIdList) {
          if ((rupeeId === 0) || (rupeeId === undefined) || (rupeeId === null)) {
            answer += " "
            continue;
          }

          if (typeof rupeeId === "string") {
            answer += rupeeId;
            continue;
          }

          const inner = getRupeeInnerValue(rupeeId);
          const outer = getRupeeOuterValue(rupeeId);
          for (const soundId of [inner, outer]) {
            if (soundId === 0) {
              continue;
            }
            answer += (this.soundCatalog[soundId] || "?");
          }
      }

      return answer;
    },
  }
});
</script>

<style>
.translation-box label, .title-box label {
  width: 100%;
}
</style>