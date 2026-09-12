const fs = require('fs');
let compPath = 'src/app/features/products/products.ts';
let content = fs.readFileSync(compPath, 'utf8');

if (!content.includes('CategoryService')) {
  content = "import { CategoryService } from '../../services/category';\n" + content;
  content = "import { Category } from '../../models/category.model';\n" + content;
  
  let injectPoint = content.indexOf('store = inject(ProductStore);');
  if (injectPoint !== -1) {
    let before = content.substring(0, injectPoint);
    let after = content.substring(injectPoint);
    
    let toInsert = `store = inject(ProductStore);
  categoryService = inject(CategoryService);
  categories = signal<Category[]>([]);`;
    
    content = before + toInsert + after.replace('store = inject(ProductStore);', '');
    
    // Add to ngOnInit
    let onInitPoint = content.indexOf('ngOnInit() {');
    if (onInitPoint !== -1) {
      content = content.replace('ngOnInit() {', "ngOnInit() {\n    this.categoryService.getAll().subscribe(cats => this.categories.set(cats));");
    } else {
      content = content.replace('constructor() {', "ngOnInit() {\n    this.categoryService.getAll().subscribe(cats => this.categories.set(cats));\n  }\n\n  constructor() {");
    }
    
    fs.writeFileSync(compPath, content);
    console.log('products.ts updated');
  }
}
