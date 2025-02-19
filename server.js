const http = require('http');
const url = require('url');
const mysql = require('mysql2');
require('dotenv').config(); // Load .env variables

// Create a connection pool (manages multiple connections efficiently)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT || 25060,  // DigitalOcean’s MySQL port
    ssl: { rejectUnauthorized: false },  // Enables SSL for DigitalOcean
    waitForConnections: true,
    connectionLimit: 10,  // Max simultaneous connections
    queueLimit: 0
});

console.log("DB_USER from process.env:", process.env.DB_USER);
console.log("DB_HOST from process.env:", process.env.DB_HOST);
console.log("DB_PASSWORD from process.env:", process.env.DB_PASSWORD);

function initializeTable() {
    pool.query(`
        CREATE TABLE IF NOT EXISTS patients (
            patientid INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            dateOfBirth DATETIME NOT NULL
        ) ENGINE=InnoDB;
    `, (err, result) => {
        if (err) {
            console.error("Error creating table:", err.message);
        } else {
            console.log("Table 'patients' is ready.");
        }
    });
}

initializeTable();


const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Content-Type', 'application/json');

    const parsedUrl = url.parse(req.url, true);
    let sqlQuery = parsedUrl.pathname.replace("/sql/", "");
    let decodedQuery = decodeURIComponent(sqlQuery);
    console.log(decodedQuery);

    if (req.method === 'GET' || req.method === 'POST') {
        // Check if the table exists before executing the query
        pool.query("SHOW TABLES LIKE 'patients'", (err, result) => {
            if (err) {
                console.error("Error checking table existence:", err.message);
                res.writeHead(500);
                return res.end(JSON.stringify({ error: err.message }));
            }
            if (result.length === 0) {
                // Table does not exist, recreate it
                initializeTable();
            }
            // Execute the query
            pool.query(decodedQuery, (err, result) => {
                if (err) {
                    console.error("Database query failed:", err.message);
                    res.writeHead(500);
                    return res.end(JSON.stringify({ error: err.message }));
                }
                console.log(result);
                res.writeHead(200);
                res.end(JSON.stringify(result));
            });
        });
    } else {
        res.writeHead(405);
        res.end(JSON.stringify({ error: "Only INSERT and SELECT statements allowed" }));
    }
});

const PORT = process.env.PORT || 3000;  // DigitalOcean assigns a port dynamically
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
