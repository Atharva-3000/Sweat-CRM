const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data/gym-db.json', 'utf8'));
console.log("Settings in DB:", db.settings);
