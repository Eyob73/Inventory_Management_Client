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
  'system-admin/users/users',
  'inventory/inventory',
  'reports/reports'
];

features.forEach(feat => {
  const scssPath = 'src/app/features/' + feat + '.scss';
  if (fs.existsSync(scssPath)) {
    let scss = fs.readFileSync(scssPath, 'utf8');
    
    // Replace justify-content: center with justify-content: flex-start within .filter-row
    // A simple regex approach to specifically target this block:
    // We know it looks like:
    // .filter-row {
    //   display: flex;
    //   align-items: center;
    //   justify-content: center;
    // ...
    
    // Just replace globally if it's within .filter-row block (easier to just replace all 'justify-content: center;' 
    // if we are confident it only exists for .filter-row, but let's be safer).
    
    scss = scss.replace(/\.filter-row\s*\{([\s\S]*?)justify-content:\s*center;([\s\S]*?)\}/g, '.filter-row {$1justify-content: flex-start;$2}');
    
    // Handle reports.scss which might have flex-wrap: wrap before justify-content
    scss = scss.replace(/\.filter-row\s*\{([\s\S]*?)justify-content:\s*center;([\s\S]*?)\}/, '.filter-row {$1justify-content: flex-start;$2}');
    
    fs.writeFileSync(scssPath, scss);
  }
});
console.log('Updated justify-content to flex-start');
