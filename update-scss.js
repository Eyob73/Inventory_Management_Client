const fs = require('fs');

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
  const scssPath = 'src/app/features/' + feat + '.scss';
  if (fs.existsSync(scssPath)) {
    let scss = fs.readFileSync(scssPath, 'utf8');
    
    // Replace .filter-row styles
    let startIdx = scss.indexOf('.filter-row {');
    if (startIdx !== -1) {
      let nextBrace = scss.indexOf('}', startIdx);
      // We want to replace everything inside .filter-row { ... } up to the end of mat-form-field.
      // Easiest is just regex or string manipulation.
      let newLayout = `.filter-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;

  mat-form-field {
    flex: 1 1 200px;
    max-width: 320px;
    width: 100%;
    margin-bottom: -1.25em;
  }

  .btn {
    flex-shrink: 0;
  }
}`;
      
      // Since it's nested, regex is hard. Let's just do a naive replacement if we know exactly what it looks like.
      // Before, I just had .filter-row { display: flex; ... mat-form-field.search-field { ... } }
      let pattern = /\.filter-row\s*\{[\s\S]*?mat-form-field\.search-field\s*\{[\s\S]*?\}[\s\S]*?\}/;
      if (pattern.test(scss)) {
         scss = scss.replace(pattern, newLayout);
      } else {
         // Maybe mat-form-field { instead of mat-form-field.search-field
         let pattern2 = /\.filter-row\s*\{[\s\S]*?mat-form-field\s*\{[\s\S]*?\}[\s\S]*?\}/;
         if (pattern2.test(scss)) {
           scss = scss.replace(pattern2, newLayout);
         }
      }
      fs.writeFileSync(scssPath, scss);
    }
  }
});
console.log('Updated SCSS layouts');
