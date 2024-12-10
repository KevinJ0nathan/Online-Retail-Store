// script.js

// Handle registration form submission
document.getElementById('registrationForm').addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent form from submitting the default way

  // Get form data
  const formData = new FormData(event.target);
  const data = {};

  formData.forEach((value, key) => {
      data[key] = value;
  });

  const password = data.password;
  const confirmPassword = data.confirmPassword;

  // Validate password length
  if (password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return; // Stop form submission
  }

  // Validate that passwords match
  if (password !== confirmPassword) {
      alert('Passwords do not match. Please confirm your password.');
      return; // Stop form submission
  }

  // Proceed with the fetch request if validation passes
  fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
  })
      .then((response) => {
          if (!response.ok) {
              throw new Error('Failed to register');
          }
          return response.text();
      })
      .then((result) => {
          alert(result); // Show success message
          window.location.href = '/'; // Redirect to login page
      })
      .catch((error) => {
          console.error('Error:', error);
          alert('There was an error registering the customer');
      });
});

// Handle Back to Login button click
document.getElementById('backToLogin').addEventListener('click', function () {
  window.location.href = 'login.html'; // Redirect to login page
});
