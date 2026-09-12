const fs = require('fs');

let compPath = 'src/app/features/products/product-details/product-details.ts';
let content = fs.readFileSync(compPath, 'utf8');

// Import MatDialog and the new component
if (!content.includes('MatDialog')) {
  content = content.replace("import { MatButtonModule } from '@angular/material/button';", "import { MatButtonModule } from '@angular/material/button';\nimport { MatDialog } from '@angular/material/dialog';\nimport { ImagePreviewDialogComponent } from '../../../ui/image-preview-dialog/image-preview-dialog.component';");
  
  let injectStr = "private confirmDialog = inject(ConfirmDialogService);\n  private dialog = inject(MatDialog);";
  content = content.replace("private confirmDialog = inject(ConfirmDialogService);", injectStr);
  
  // Replace toggleFullscreen method
  let toggleOld = `  toggleFullscreen() {
    const dialog = this.dialogRef?.nativeElement;
    if (!dialog) return;

    if (this.isFullscreen()) {
      dialog.close();
      this.isFullscreen.set(false);
    } else {
      dialog.showModal();
      this.isFullscreen.set(true);
    }
  }`;
  
  let toggleNew = `  toggleFullscreen() {
    if (!this.imageUrl()) return;
    this.dialog.open(ImagePreviewDialogComponent, {
      data: { imageUrl: this.imageUrl(), altText: this.product().name },
      panelClass: 'fullscreen-image-dialog',
      backdropClass: 'fullscreen-image-backdrop',
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
    });
  }`;
  
  content = content.replace(toggleOld, toggleNew);
  
  fs.writeFileSync(compPath, content);
  console.log('product-details.ts updated');
}
