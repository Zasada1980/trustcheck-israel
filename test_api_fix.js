// Test API fix for preserving business name
const https = require('http');

const data = JSON.stringify({
  businessName: 'סטודיו יוגה "שלווה"',
  registrationNumber: '345033898'
});

const options = {
  hostname: '46.224.147.252',
  port: 80,
  path: '/api/report',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('Testing API with:');
console.log('  businessName:', 'סטודיו יוגה "שלווה"');
console.log('  registrationNumber:', '345033898');
console.log('\nExpected: API should return businessName as "סטודיו יוגה שלווה"');
console.log('          (not random mock name like "גן ילדים שמש")\n');

const req = https.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      
      console.log('✅ API Response:');
      console.log('  name:', response.businessData.name);
      console.log('  registrationNumber:', response.businessData.registrationNumber);
      console.log('  type:', response.businessData.type);
      console.log('  status:', response.businessData.status);
      
      // Verify fix worked
      if (response.businessData.name === 'סטודיו יוגה "שלווה"') {
        console.log('\n🎉 SUCCESS! Business name preserved correctly!');
      } else {
        console.log('\n⚠️  WARNING: Business name was:', response.businessData.name);
        console.log('   Expected: סטודיו יוגה "שלווה"');
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.error('Raw response:', body.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(data);
req.end();
