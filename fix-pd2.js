const fs = require('fs');
let compPath = 'src/app/features/products/product-details/product-details.ts';
let content = fs.readFileSync(compPath, 'utf8');

// Ensure MatDialogModule is imported properly
if (!content.includes('MatDialogModule}')) {
  content = content.replace("import { MatDialog, MatDialogModule }", "import { MatDialog }");
  content = content.replace("import { MatDialog } from '@angular/material/dialog';", "import { MatDialog, MatDialogModule } from '@angular/material/dialog';");
}

// Remove closeDialog completely
content = content.replace(/  closeDialog\(event\?: Event\) \{[\s\S]*?this\.isFullscreen\.set\(false\);\s*\}/, '');

fs.writeFileSync(compPath, content);
console.log('product-details.ts fixed again');
