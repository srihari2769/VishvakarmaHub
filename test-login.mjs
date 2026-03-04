const res = await fetch('https://vishvakarmahub.vercel.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@vishvakarmahub.com',
    password: 'Admin@VishvakarmaHub',
  }),
});
console.log('Status:', res.status);
const data = await res.text();
console.log('Response:', data);
