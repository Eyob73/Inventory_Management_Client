const fs = require('fs');
const path = require('path');

const features = [
  'products/products',
  'categories/categories',
  'customers/customers',
  'suppliers/suppliers',
  'purchases/purchases',
  'system-admin/companies/companies',
  'system-admin/users/users'
];

features.forEach(feat => {
  const tsPath = path.join('src/app/features', feat + '.ts');
  if (fs.existsSync(tsPath)) {
    let ts = fs.readFileSync(tsPath, 'utf8');
    
    // Add FormsModule import if not present
    if (!ts.includes('FormsModule')) {
      ts = "import { FormsModule } from '@angular/forms';\n" + ts;
      // Add to imports array
      ts = ts.replace(/imports:\s*\[/, 'imports: [\n    FormsModule,');
      fs.writeFileSync(tsPath, ts);
    }
  }
});
console.log('Added FormsModule');
