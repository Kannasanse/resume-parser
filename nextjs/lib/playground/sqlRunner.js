import initSqlJs from 'sql.js';

let SQL = null;
let db  = null;

async function init() {
  SQL = await initSqlJs({
    locateFile: file =>
      `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`,
  });
  db = new SQL.Database();
  db.run(`
    CREATE TABLE employees (
      id INTEGER PRIMARY KEY, name TEXT, department TEXT,
      salary INTEGER, hire_date TEXT
    );
    INSERT INTO employees VALUES
      (1,'Alice','Engineering',95000,'2021-03-15'),
      (2,'Bob','Marketing',72000,'2020-07-01'),
      (3,'Carol','Engineering',88000,'2022-01-10'),
      (4,'David','HR',65000,'2019-11-20'),
      (5,'Eve','Engineering',102000,'2018-06-05');

    CREATE TABLE departments (
      id INTEGER PRIMARY KEY, name TEXT, budget INTEGER
    );
    INSERT INTO departments VALUES
      (1,'Engineering',500000),
      (2,'Marketing',200000),
      (3,'HR',150000);
  `);
}

export async function runSQL(query) {
  if (!SQL || !db) await init();

  const results = [];
  const errors  = [];

  const statements = query.split(';').map(s => s.trim()).filter(Boolean);

  for (const stmt of statements) {
    try {
      const res = db.exec(stmt);
      if (res.length > 0) {
        results.push(...res);
      } else {
        results.push({ message: 'Query executed successfully.' });
      }
    } catch (err) {
      errors.push({ message: err.message, statement: stmt });
    }
  }

  return { results, errors };
}

export function resetDB() {
  if (db) db.close();
  db  = null;
  SQL = null;
}
