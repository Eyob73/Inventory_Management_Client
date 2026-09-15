const fs = require('fs');
let html = fs.readFileSync('src/app/features/system-admin/users/users.html', 'utf8');
html = html.replace(/{{ element\.roles\?\.\[0\] \|\| '{{ t\('common\.unknown'\) }}' }}/, "{{ element.roles?.[0] || t('common.unknown') }}");
fs.writeFileSync('src/app/features/system-admin/users/users.html', html);
console.log('fixed users.html');
