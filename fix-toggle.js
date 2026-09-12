const fs = require('fs');
let compPath = 'src/app/features/products/product-details/product-details.ts';
let content = fs.readFileSync(compPath, 'utf8');

let toggleOldRegex = /  toggleFullscreen\(\) \{[\s\S]*?this\.isFullscreen\.set\(true\);\s*\}/;

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
content = content.replace(toggleOldRegex, toggleNew);

fs.writeFileSync(compPath, content);
console.log('product-details.ts toggleFullscreen fixed');
