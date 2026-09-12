const fs = require('fs');
const path = require('path');

const features = [
  { p: 'categories/categories', b: 'store.search()' },
  { p: 'customers/customers', b: 'store.search()' },
  { p: 'suppliers/suppliers', b: 'store.search()' },
  { p: 'purchases/purchases', b: 'store.search()' },
  { p: 'users/users', b: 'store.search()' },
  { p: 'system-admin/companies/companies', b: 'searchQuery()' },
  { p: 'system-admin/users/users', b: 'searchQuery()' }
];

features.forEach(feat => {
  const htmlPath = path.join('src/app/features', feat.p + '.html');
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace(/\[ngModel\]=""/g, '[ngModel]="' + feat.b + '"');
    fs.writeFileSync(htmlPath, html);
  }
});
console.log('Fixed ngModel bindings');
