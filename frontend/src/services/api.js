import axios from 'axios';

const baseURL = 'http://localhost:3001'; // Replace with your Node.js backend URL

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    // You might include authorization headers here if needed
  },
});

export default api;