const fs = require('fs');
const path = require('path');

const features = [
  'products/products',
  'categories/categories',
  'inventory/inventory',
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
    scss = scss.replace(/margin-bottom:\s*0;/g, '');
    
    // Check if .filter-row needs mat-form-field styling like sales-history:
    /*
    mat-form-field {
      width: 100%;
      margin-bottom: -1.25em;
    }
    */
    fs.writeFileSync(scssPath, scss);
  }
});
console.log('Fixed margin-bottom');
