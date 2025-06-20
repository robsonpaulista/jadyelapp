const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./data.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to database');

  // Query all users
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      console.error('Error querying users:', err);
      return;
    }
    console.log('Users in database:');
    console.log(JSON.stringify(rows, null, 2));
    
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        return;
      }
      console.log('Database connection closed');
    });
  });
}); 