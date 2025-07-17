import { getRupeeInnerValue, getRupeeOuterValue, Rupee } from "@/models/Rupee";
import { Sound } from "@/server/sound";

async function getSoundCatalog(): [Record<number, string>, Record<number, [number, string]>] {
    const res = await fetch("/api/sound");
    const soundList = await res.json();

    const soundCatalog = Object.fromEntries(soundList.map(function(sound: Sound): [number, string] {
        return [sound.id, sound.guessed_sound];
    }));

    return soundList
}






function getSentence(rupeeIdList: Array<number>): string {
  let answer = "";
  for (const rupeeId of rupeeIdList) {
      if (rupeeId === 0) {
        answer += " "
        continue;
      }

      const inner = getRupeeInnerValue(rupeeId);
      const outer = getRupeeOuterValue(rupeeId);
      for (const soundId of [inner, outer]) {
        if (soundId === 0) {
          continue;
        }
        answer += (soundCatalog[soundId] || "?");
      }
  }

  return answer;
}