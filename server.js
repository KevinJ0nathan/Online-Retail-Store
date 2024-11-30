const express = require('express');
const mysql = require('mysql');
const path = require('path');
const bodyParser = require('body-parser')

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// MySQL connection setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'RetailDB',
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Simplify HTML routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'Registration.html'));
});

// POST endpoint to handle registration form submission
app.post('/register', (req, res) => {
  const { firstName, lastName, email, phoneNumber, address, password } = req.body;

  // Check if email already exists
  const checkEmailQuery = `SELECT * FROM Customers WHERE email = ?`;

  db.query(checkEmailQuery, [email], (err, results) => {
    if (err) {
      console.error('Error checking email:', err);
      return res.status(500).send('Error checking email');
    }

    if (results.length > 0) {
      return res.status(400).send('Email already in use');
    }

      // Insert new customer
      const query = `INSERT INTO Customers (firstName, lastName, email, phoneNumber, address, password) 
                     VALUES (?, ?, ?, ?, ?, ?)`;

      db.query(query, [firstName, lastName, email, phoneNumber, address, password], (err, result) => {
        if (err) {
          console.error('Error inserting data:', err);
          return res.status(500).send('Error inserting data into database');
        }
        res.status(200).send('Customer registered successfully');
      });
    });
  });

// Login route (plain text password)
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Query to check if the email exists in the database
  db.query('SELECT * FROM Customers WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const user = results[0];
    
    if (password === user.Password) {
      res.status(200).json({ message: 'Login successful', redirectUrl: '/main.html' });
    } else {
      res.status(401).json({ message: 'Invalid password' });
    }
  });
});





// API to get data from MySQL
app.get('/data', (req, res) => {
  const query = 'SELECT * FROM Customers';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.json(results);
  });
});

// Static files serving
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
