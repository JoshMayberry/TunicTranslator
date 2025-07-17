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
          @select:rupee="onRupeeClick"
          @select:text="onTextClick"
          @select:space="onSpaceClick"
        />
        <mcw-textfield
          v-model="sentence.translation"
          class="translation-box"
          label="Translation"
          multiline
        />
      </div>
      <div style="display: flex; flex-direction: column;">
        <RupeeDisplay
          v-if="selectedRupee"
          :rupee="selectedRupee"
          style="flex:1"
          :is-word="false"
          :disabled="!selectedRupee"
          @update:rupee="onUpdateRupee($event)"
        ></RupeeDisplay>
        <mcw-textfield
          v-if="typeof selectedRupeeValue === 'string'"
          v-model="rupeePlainText"
          class="title-box"
        />
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
import { Rupee } from "@/models/Rupee";
import debounce from "lodash.debounce";
import { Sentence } from "@/server/sentence";

const testSentence: Sentence = {
  id: undefined,
  title: "test",
  word_list: [123, 7289, 8, null, 2, "lorem ipsum", 73, 83],
  translation: "lorem ipsum dolor sit amet",
  confidence: 30,
  picture: "",
  comment: "lorem ipsum",
  tags: ["lorem", "ipsum"],
};

export default defineComponent({
  name: "SentenceViewer",
  components: {
    RupeeDisplay,
    RupeeSentence,
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
    }
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    return { route, router };
  },
  async created() {
    this.debouncedSave = debounce(this.saveSentence, 500);

    const idParam = this.route.params.id;
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
        comment: "",
        tags: []
      };
    }

    this.$nextTick(() => {
      this.canSave = true;
    });
  },
  mounted() {
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
      const newRupee = Rupee.fromRepresentation(0).representation(true);
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
      this.sentence.word_list[this.selectedRupeeIndex] = rupee.representation(true)
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
    }
  },
});
</script>

<style>
.translation-box label, .title-box label {
  width: 100%;
}
</style>