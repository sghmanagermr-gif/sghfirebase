const http = require('http');

http.get('http://localhost:5173', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Has v2.11.2 in title:', data.includes('SGH - v2.11.2'));
    console.log('container-btn-cuadratura display none:', data.includes('id="container-btn-cuadratura" style="display: none !important;"'));
  });
}).on('error', err => {
  console.log('HTTP Error:', err.message);
});
