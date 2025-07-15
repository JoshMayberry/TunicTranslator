import { db } from './db'

export function saveSymbolHistory(symbol: any): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT OR REPLACE INTO symbols
      (id, type, guessed_sound, alternate_guesses, confidence, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      symbol.id,
      symbol.type,
      symbol.guessed_sound,
      JSON.stringify(symbol.alternate_guesses || []),
      symbol.confidence,
      symbol.notes
    ], err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export function getAllSymbols(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM symbols`, [], (err, rows) => {
      if (err) return reject(err)
      const parsed = rows.map(row => ({
        ...row,
        alternate_guesses: JSON.parse(row.alternate_guesses || '[]')
      }))
      resolve(parsed)
    })
  })
}

export function saveSymbol(symbol: any): Promise<void> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM symbols WHERE id = ? AND type = ?`,
      [symbol.id, symbol.type],
      (err, existing) => {
        if (err) return reject(err)

        if (!existing || JSON.stringify(existing) !== JSON.stringify(symbol)) {
          saveSymbolHistory(symbol)
        }

        db.run(
          `INSERT OR REPLACE INTO symbols
           (id, type, guessed_sound, alternate_guesses, confidence, notes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            symbol.id,
            symbol.type,
            symbol.guessed_sound,
            JSON.stringify(symbol.alternate_guesses || []),
            symbol.confidence,
            symbol.notes
          ],
          err2 => {
            if (err2) return reject(err2)
            resolve()
          }
        )
      }
    )
  })
}