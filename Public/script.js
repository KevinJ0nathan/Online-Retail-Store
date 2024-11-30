// script.js
document.getElementById('registrationForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form from submitting the default way
  
    const formData = new FormData(event.target);
    const data = {};
  
    formData.forEach((value, key) => {
      data[key] = value;
    });
  
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
        alert(result); // Show success message or error
        event.target.reset(); // Reset the form
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('There was an error registering the customer');
      });
  });
