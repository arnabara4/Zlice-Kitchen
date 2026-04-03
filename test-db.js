const fs = require('fs');
const envStr = fs.readFileSync('/Users/arnabjena/Desktop/Internship/Zlice/super-app/.env.production', 'utf-8');
const env = Object.fromEntries(envStr.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
  const i = l.indexOf('=');
  return [l.slice(0, i), l.slice(i + 1).replace(/["']/g, '').trim()];
}));

async function check() {
  try {
    const url = `${env.SUPABASE_URL.replace(/[\r\n"']/g, '')}/rest/v1/canteens?select=id,name,email,verification_status,home_cook&order=created_at.desc&limit=10`;
    console.log("Fetching: " + url);
    const res = await fetch(url, {
      headers: {
        'apikey': env.SUPABASE_ANON_KEY.replace(/[\r\n"']/g, ''),
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY.replace(/[\r\n"']/g, '')}`
      }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.log("Error:", err);
  }
}
check();
