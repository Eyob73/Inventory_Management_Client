const fs = require('fs');

let compPath = 'src/app/features/products/product-details/product-details.ts';
let content = fs.readFileSync(compPath, 'utf8');

// Add MatDialogModule to imports array
if (!content.includes('MatDialogModule')) {
  content = content.replace("import { MatDialog } from '@angular/material/dialog';", "import { MatDialog, MatDialogModule } from '@angular/material/dialog';");
  content = content.replace("imports: [CommonModule, DatePipe, MatIconModule],", "imports: [CommonModule, DatePipe, MatIconModule, MatDialogModule],");
}

// Remove the obsolete ViewChild
content = content.replace(/@ViewChild\('fullscreenDialog'\) dialogRef!: ElementRef<HTMLDialogElement>;\s*/g, '');
// Remove ElementRef and ViewChild imports if they are no longer used? No need, it doesn't hurt.

fs.writeFileSync(compPath, content);
console.log('product-details.ts fixed');
