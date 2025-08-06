import { PossibleRupeeValue } from '@/models/Rupee'
import { db } from './db'
import { Sentence, DbSentence } from "./types"

export function sentenceEnsureTable(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE "sentence" (
        "id"	INTEGER NOT NULL UNIQUE,
        "order"	INTEGER DEFAULT 0,
        "confidence"	INTEGER NOT NULL,
        "title"	TEXT NOT NULL,
        "translation"	TEXT,
        "comment"	TEXT,
        "picture"	TEXT,
        "page_number" TEXT,
        "page_overlay" TEXT,
        "word_list"	JSON NOT NULL DEFAULT '[]',
        "tags"	JSON,
        PRIMARY KEY("id" AUTOINCREMENT)
      )
    `, [], err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function getWordListFromString(payload?: string): Array<PossibleRupeeValue> {
  if (!payload) return [];

  try {
    const list = JSON.parse(payload);
    return list.map((item: string) => {
      if (item.startsWith("<R:")) {
        const match = item.match(/^<R:(\d+)>$/);
        if (match) {
          return parseInt(match[1], 10);
        }
      } else if (item === "<N>") {
        return null;
      } else {
        return item
      }
    });
  } catch (err) {
    console.error("Failed to parse word_list:", err);
    return [];
  }
}

function getStringFromWordList(payload?: Array<PossibleRupeeValue>): string {
  if (!payload) return "[]";

  return JSON.stringify(
    payload.map(item => {
      if (typeof item == "number") {
        return `<R:${item}>`; // A Rupee
      } else if (!item) {
        return "<N>"; // A Space
      } else {
        return item; // Plain text
      }
    })
  );
}

export function sentenceGetById(id: number): Promise<Sentence | null> {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM sentence WHERE id = ?`, [id], (err, row: DbSentence) => {
      if (err) return reject(err);
      if (!row) return resolve(null); // No matching row

      const sentence: Sentence = {
        id: row.id,
        order: row.order,
        title: row.title || "",
        translation: row.translation || "",
        picture: row.picture || "",
        comment: row.comment || "",
        confidence: row.confidence || 0,
        page_number: row.page_number || "n/a",
        page_overlay: JSON.parse(row.page_overlay || "{}"),
        word_list: getWordListFromString(row.word_list),
        tags: JSON.parse(row.tags || "[]"),
      };

      resolve(sentence);
    });
  });
}


export function sentenceGetAll(): Promise<Sentence[]> {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM sentence`, [], (err, rows: Array<DbSentence>) => {
      if (err) return reject(err)
      const parsed: Array<Sentence> = rows.map(row => {
        return {
          id: row.id,
          order: row.order,
          title: row.title || "",
          translation: row.translation || "",
          picture: row.picture || "",
          comment: row.comment || "",
          confidence: row.confidence || 0,
          page_number: row.page_number || "n/a",
          page_overlay: JSON.parse(row.page_overlay || "{}"),
          word_list: getWordListFromString(row.word_list),
          tags: JSON.parse(row.tags || "[]"),
        };
      });
      resolve(parsed)
    })
  })
}

export function sentenceSave(data: Sentence): Promise<number> {
  return new Promise((resolve, reject) => {
    const isNew = (data.id === undefined || data.id === null);

    const query = isNew
      ? `
        INSERT INTO sentence ("order", confidence, title, translation, comment, picture, page_number, page_overlay, word_list, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      : `
        INSERT OR REPLACE INTO sentence
        (id, "order", confidence, title, translation, comment, picture, page_number, page_overlay, word_list, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

    const params = isNew
      ? [
          data.order,
          data.confidence,
          data.title,
          data.translation,
          data.comment,
          data.picture,
          data.page_number,
          JSON.stringify(data.page_overlay),
          getStringFromWordList(data.word_list),
          JSON.stringify(data.tags),
        ]
      : [
          data.id,
          data.order,
          data.confidence,
          data.title,
          data.translation,
          data.comment,
          data.picture,
          data.page_number,
          JSON.stringify(data.page_overlay),
          getStringFromWordList(data.word_list),
          JSON.stringify(data.tags),
        ];

    db.run(query, params, function (err) {
      if (err) return reject(err);
      resolve((isNew || (data.id === undefined)) ? this.lastID : data!.id);
    });
  });
}