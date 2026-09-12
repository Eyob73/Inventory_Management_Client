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
  const htmlPath = path.join('src/app/features', feat + '.html');
  const scssPath = path.join('src/app/features', feat + '.scss');
  
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    // Replace .filter-panel with .filters-card
    html = html.replace(/class="filter-panel"/g, 'class="filters-card"');
    // Replace .toolbar with .filter-row
    html = html.replace(/class="toolbar[^"]*"/g, 'class="filter-row"');
    // Replace .search-form-field with .search-field
    html = html.replace(/class="search-form-field"/g, 'class="search-field"');
    // If it has ngModel, great. If not, whatever.
    fs.writeFileSync(htmlPath, html);
  }

  if (fs.existsSync(scssPath)) {
    let scss = fs.readFileSync(scssPath, 'utf8');
    
    // Replace .filter-panel with .filters-card
    scss = scss.replace(/\.filter-panel\s*\{/g, '.filters-card {');
    // Replace .toolbar with .filter-row
    scss = scss.replace(/\.toolbar\s*\{/g, '.filter-row {');
    // Replace .search-form-field with mat-form-field.search-field
    scss = scss.replace(/\.search-form-field\s*\{/g, 'mat-form-field.search-field {');
    
    // Add margin-bottom: -1.25em to the search-field if it's not there
    if (scss.includes('mat-form-field.search-field {') && !scss.includes('margin-bottom: -1.25em')) {
      scss = scss.replace(/mat-form-field\.search-field\s*\{/, 'mat-form-field.search-field {\n    margin-bottom: -1.25em;');
    }
    
    fs.writeFileSync(scssPath, scss);
  }
});
console.log('Done replacing classes');
