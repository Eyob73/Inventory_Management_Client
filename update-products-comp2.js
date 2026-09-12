const fs = require('fs');
let compPath = 'src/app/features/products/products.ts';
let content = fs.readFileSync(compPath, 'utf8');

if (!content.includes('onCategoryChange')) {
  let toInsert = `
  onCategoryChange(categoryId: string): void {
    this.store.loadProducts({ pageIndex: 1, pageSize: this.store.pageSize(), search: this.store.search(), categoryId });
  }`;
  
  content = content.replace('applyFilter(event: Event): void {', toInsert + '\n\n  applyFilter(event: Event): void {');
  
  if (!content.includes('signal } from')) {
    content = content.replace("import { Component", "import { signal, Component");
  }

  // Import MatSelectModule
  if (!content.includes('MatSelectModule')) {
    content = content.replace("MatInputModule,", "MatInputModule,\n    import('@angular/material/select').then(m => m.MatSelectModule),");
    content = content.replace("import { MatInputModule }", "import { MatSelectModule } from '@angular/material/select';\nimport { MatInputModule }");
    content = content.replace("import('@angular/material/select').then(m => m.MatSelectModule)", "MatSelectModule");
  }

  fs.writeFileSync(compPath, content);
  console.log('products.ts updated with onCategoryChange');
}
