const axios = require('axios');

async function test() {
  try {
    console.log('Testing: Buy AAPL 100');
    const response = await axios.post('http://localhost:5000/api/process', {
      input: 'Buy AAPL 100'
    });
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('Error Status:', error.response?.status);
    console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

test();
