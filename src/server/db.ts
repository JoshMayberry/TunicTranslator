import sqlite3 from 'sqlite3'

console.log("Opening database", process.cwd())
export const db = new sqlite3.Database("./src/server/tunic.sqlite")
console.log("Database Opened")
