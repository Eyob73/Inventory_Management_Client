const fs = require('fs');
const path = require('path');

const features = [
  'products/products',
  'categories/categories',
  'customers/customers',
  'suppliers/suppliers',
  'purchases/purchases',
  'users/users',
  'system-admin/companies/companies',
  'system-admin/users/users'
];

features.forEach(feat => {
  const htmlPath = path.join('src/app/features', feat + '.html');
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace(/\[value\]="([^"]+)"/g, '[ngModel]=""');
    fs.writeFileSync(htmlPath, html);
  }
});
console.log('Changed value to ngModel');
