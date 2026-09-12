const fs = require('fs');
let storePath = 'src/app/store/products.store.ts';
let content = fs.readFileSync(storePath, 'utf8');

if (!content.includes('categoryId: string')) {
  // Add to state
  content = content.replace("search: '',", "search: '',\n          categoryId: 'ALL',");

  // Add to loadProducts rxMethod type
  content = content.replace("search?: string } | void", "search?: string; categoryId?: string } | void");

  // Extract from params
  content = content.replace("const search = query.search ?? store.search();", "const search = query.search ?? store.search();\n                      const categoryId = query.categoryId ?? store.categoryId();");

  // Pass to api.getAll
  content = content.replace("api.getAll(reqPageIndex, reqPageSize, search || undefined)", "api.getAll(reqPageIndex, reqPageSize, search || undefined, categoryId)");
  
  // Save search AND categoryId to patchState
  content = content.replace("patchState(store, { search });", "patchState(store, { search, categoryId });");

  fs.writeFileSync(storePath, content);
  console.log('products.store.ts updated');
}
