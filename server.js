const http = require('http');
const url = require('url');
const mysql = require('mysql2');

// Create a connection to the database
const db = mysql.createConnection({
    host: 'localhost',  // Change if using a remote database
    user: 'alexp93',       // Your MySQL username
    password: 'asdf1234',  // Your MySQL password
    database: 'lab5_db'  // Your database name
});

// Connect to the database
db.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL!");

    // SQL query to create the table if it doesn't exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS patients (
            patientid INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            dateOfBirth DATETIME NOT NULL
        ) ENGINE=InnoDB;
    `;

    // Execute the query
    db.query(createTableQuery, (err, result) => {
        if (err) throw err;
        console.log("Table 'patients' is ready.");
    });
});


const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Content-Type', 'application/json');

    const parsedUrl = url.parse(req.url, true);
    let sqlQuery = parsedUrl.pathname.replace("/sql/", "");
    let decodedQuery = decodeURIComponent(sqlQuery);
    console.log(decodedQuery);

    if (req.method === 'GET') {
        // Handle SELECT queries
        if (!decodedQuery.toLowerCase().startsWith("select")) {
            console.log("Only SELECT queries are allowed");
            res.writeHead(400);
            return res.end(JSON.stringify({ error: "Only SELECT queries are allowed" }));
        }

        db.query(decodedQuery, (err, result) => {
            if (err) {
                console.log(err);
                res.writeHead(500);
                return res.end(JSON.stringify({ error: err.message }));
            }
            console.log(result);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        });
    } else if (req.method === 'POST') {
        // Handle INSERT queries
        if (!decodedQuery.toLowerCase().startsWith("insert")) {
            console.log("Only INSERT queries are allowed");
            res.writeHead(400);
            return res.end(JSON.stringify({ error: "Only INSERT queries are allowed" }));
        }

        db.query(decodedQuery, (err, result) => {
            if (err) {
                console.log(err);
                res.writeHead(500);
                return res.end(JSON.stringify({ error: err.message }));
            }
            console.log(result);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        });
    }
    else {
        res.writeHead(405);
        res.end(JSON.stringify({ error: "Only INSERT and SELECT statements allowed" }));
    }
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});