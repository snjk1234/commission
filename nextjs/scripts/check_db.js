const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim().replace(/"/g, '');
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { count: branches } = await supabase.from('commission_branches').select('*', { count: 'exact', head: true });
  const { count: supervisors } = await supabase.from('commission_supervisors').select('*', { count: 'exact', head: true });
  const { count: assignments } = await supabase.from('commission_branch_assignments').select('*', { count: 'exact', head: true });
  console.log(`STATS: Branches=${branches}, Supervisors=${supervisors}, Assignments=${assignments}`);
}
check();
