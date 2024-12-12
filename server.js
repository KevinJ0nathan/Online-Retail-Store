const express = require('express');
const mysql = require('mysql');
const path = require('path');
const bodyParser = require('body-parser')
const session = require('express-session');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session setup
app.use(session({
  secret: 'cbf5e89abf563bd5e14a4f8e53799c1fc9bffb870d6b9b3dbf5c6e53f2256872', // Change this to a strong, random key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set `secure: true` if using https
}));

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
  res.sendFile(path.join(__dirname, 'Public/Registration.html'));
});

function ensureAuthenticated(req, res, next) {
  if (req.session.customerid) {
    return next();
  } else {
    // Redirect to login for front-end pages
    res.redirect('/');
  }
}

app.get('/main.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'Public/main.html'));
});

app.get('/product.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'Public/product.html'));
});

app.get('/settings.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'Public/settings.html'));
});

app.get('/profile.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'Public/profile.html'));
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
      // Store customer ID in the session
      req.session.customerid = user.CustomerID;
      console.log('Customer ID saved to session:', req.session.customerid);
      res.status(200).json({ message: 'Login successful', redirectUrl: '/main.html' });
    } else {
      res.status(401).json({ message: 'Invalid password' });
    }
  });
});

app.get('/reset-session', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Could not reset session.");
    } else {
      res.redirect('/'); 
    }
  });
});


app.get('/profile', (req, res) => {
  if (!req.session.customerid) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Use the customer ID from the session to fetch user data
  const customerId = req.session.customerid;
  db.query('SELECT * FROM Customers WHERE CustomerID = ?', [customerId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Return user profile information
    res.json(results[0]);
  });
});

// PUT endpoint to update user profile
app.put('/profile', (req, res) => {
  if (!req.session.customerid) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const customerId = req.session.customerid;
  const { firstName, lastName, email, phoneNumber, address, password } = req.body;

  // Build the update query dynamically based on provided fields
  const fields = [];
  const values = [];

  if (firstName) {
    fields.push('FirstName = ?');
    values.push(firstName);
  }
  if (lastName) {
    fields.push('LastName = ?');
    values.push(lastName);
  }
  if (email) {
    fields.push('Email = ?');
    values.push(email);
  }
  if (phoneNumber) {
    fields.push('PhoneNumber = ?');
    values.push(phoneNumber);
  }
  if (address) {
    fields.push('Address = ?');
    values.push(address);
  }
  if (password) {
    fields.push('Password = ?');
    values.push(password);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  const query = `UPDATE Customers SET ${fields.join(', ')} WHERE CustomerID = ?`;
  values.push(customerId);

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error updating profile:', err);
      return res.status(500).json({ message: 'Failed to update profile' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Profile updated successfully' });
  });
});


app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const query = 'SELECT * FROM Products WHERE ProductID = ?';

  db.query(query, [productId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(results[0]); // Return the product details
  });
});

// API endpoint to fetch product data
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM Products';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'Failed to fetch product data' });
    }

    // Send the product data as JSON
    res.json(results);
  });
});

// API endpoint to fetch category data
app.get('/api/categories', (req, res) => {
  const query = 'SELECT * FROM Categories'

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({error: 'Failed to fetch categories'});
    }

    res.json(results);
  });
});

// API endpoint to fetch product data
app.get('/api/product_reviews', (req, res) => {
  const query = 'SELECT * FROM Reviews';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching product reviews:', err);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    // Send the product data as JSON
    res.json(results);
  });
});

app.get('/api/customers/me', (req, res) => {
  const customerId = req.session.customerid;

  if (!customerId) {
    console.log('No customer ID found in session'); // Add a log to debug if session ID is missing
    return res.status(400).json({ message: 'Customer ID is required in the session.' });
  }

  // Use the customer ID from the session to query the database
  db.query('SELECT * FROM Customers WHERE CustomerID = ?', [customerId], (err, results) => {
    if (err) {
      console.error('Error fetching customer:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length > 0) {
      const customer = results[0];
      console.log('Customer data fetched:', customer); // Debug the result to ensure you're getting the data
      res.json(customer);  // Send back all customer information
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  });
});


// API to add things to shopping cart
app.post('/api/addToShoppingCart', (req, res) => {
  const { productId, quantity } = req.body;
  const customerId = req.session.customerid;

  if (!customerId) {
    return res.status(401).json({ error: 'Unauthorized: Customer ID is missing' });
  }

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid product ID or quantity' });
  }

  const query = `
    INSERT INTO ShoppingCart (CustomerID, ProductID, Quantity)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE Quantity = Quantity + ?
  `;

  db.query(query, [customerId, productId, quantity, quantity], (err, result) => {
    if (err) {
      console.error('Database error adding to shopping cart:', err);
      return res.status(500).json({ error: 'Failed to add item to shopping cart' });
    }

    res.json({ message: 'Item successfully added to shopping cart' });
  });
});


// API endpoint to fetch review summary for a specific product
app.get('/api/reviewSummary/:productId', (req, res) => {
  const productId = req.params.productId;

  // Query to fetch review breakdown and average rating for the product
  const query = `
   SELECT 
      ROUND(AVG(Rating), 1) AS averageRating,
      COUNT(*) AS totalReviews,
      SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END) AS fiveStar,
      SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END) AS fourStar,
      SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END) AS threeStar,
      SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END) AS twoStar,
      SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END) AS oneStar,
      SUM(CASE WHEN Rating >= 1 AND Rating <= 5 THEN 1 ELSE 0 END) AS totalRatings  
    FROM Reviews
    WHERE ProductID = ?`;

  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    if (results.length === 0 || !results[0].totalReviews) {
      return res.status(404).json({ message: 'No reviews found for this product' });
    }

    // Add the review breakdown details
    const reviewData = {
      averageRating: results[0].averageRating,
      totalReviews: results[0].totalReviews,
      totalRatings: results[0].totalRatings,
      breakdown: {
        fiveStar: results[0].fiveStar,
        fourStar: results[0].fourStar,
        threeStar: results[0].threeStar,
        twoStar: results[0].twoStar,
        oneStar: results[0].oneStar,
      },
    };

    res.json(reviewData);
  });
});

// API endpoint to fetch reviews data with customer details for a specific product
app.get('/api/reviews/:productId', (req, res) => {
  const productId = req.params.productId;

  const query = `
    SELECT 
      r.ReviewID, r.ProductID, r.CustomerID, r.Rating, r.ReviewText, r.ReviewDate,
      c.firstName, c.lastName
    FROM Reviews r
    JOIN Customers c ON r.CustomerID = c.CustomerID
    WHERE r.ProductID = ?
    ORDER BY r.ReviewDate DESC
  `;

  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No reviews found for this product' });
    }

    res.json(results);
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
