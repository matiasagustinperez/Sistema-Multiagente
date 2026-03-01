import sqlite3
conn = sqlite3.connect('backend/data/proposals.db')
cur = conn.cursor()
cur.execute("SELECT name FROM pragma_table_info('proposals') WHERE name='editing_locked'")
if not cur.fetchone():
    cur.execute("ALTER TABLE proposals ADD COLUMN editing_locked BOOLEAN DEFAULT 0")
    conn.commit()
    print("OK: columna editing_locked agregada")
else:
    print("OK: columna ya existia")
conn.close()
