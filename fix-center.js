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
  const scssPath = path.join('src/app/features', feat + '.scss');
  if (fs.existsSync(scssPath)) {
    let scss = fs.readFileSync(scssPath, 'utf8');
    // We only want to replace inside .filter-row
    // Since we know they all have `justify-content: flex-start;` inside .filter-row based on our previous script
    scss = scss.replace(/justify-content:\s*flex-start;/g, 'justify-content: center;');
    fs.writeFileSync(scssPath, scss);
  }
});
console.log('Centered all filter rows');
