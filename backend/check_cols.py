import sqlite3
conn = sqlite3.connect('app/database.db')
cols = [r[1] for r in conn.execute("PRAGMA table_info(teachers)").fetchall()]
print("teachers columns:", cols)
conn.close()
