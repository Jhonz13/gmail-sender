import dns from 'dns';
import axios from 'axios';

// Forzar preferenciar IPv4 sobre IPv6 en Node.js
dns.setDefaultResultOrder('ipv4first');

async function testNetworkIPv4() {
  console.log('Testing with IPv4 first...');
  
  try {
    const res1 = await axios.get('https://httpbin.org/get', { timeout: 5000 });
    console.log('✅ httpbin.org Status:', res1.status);
  } catch (err) {
    console.log('❌ httpbin.org Error:', err.message);
  }

  try {
    const res2 = await axios.get('https://api.github.com/users/octocat', { timeout: 5000 });
    console.log('✅ GitHub API Status:', res2.status);
  } catch (err) {
    console.log('❌ GitHub API Error:', err.message);
  }

  try {
    const res3 = await axios.get('https://www.google.com', { timeout: 5000 });
    console.log('✅ Google Status:', res3.status);
  } catch (err) {
    console.log('❌ Google Error:', err.message);
  }
}

testNetworkIPv4();
