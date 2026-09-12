const fs = require('fs');

let storePath = 'src/app/store/supplier.store.ts';
let content = fs.readFileSync(storePath, 'utf8');

if (!content.includes('statusFilter: string')) {
  // Add statusFilter to state
  content = content.replace("search: '',", "search: '',\n      statusFilter: 'all',");

  // Update interface if exists
  content = content.replace("search: string;", "search: string;\n    statusFilter: 'all' | 'active' | 'inactive';");
  
  // Update filtered logic
  let oldLogic = `        const term = store.search().toLowerCase().trim();
        if (!term) return all;
        return all.filter(
          (s) =>
            s.name.toLowerCase().includes(term) ||
            s.email?.toLowerCase().includes(term) ||
            s.phoneNumber?.includes(term)
        );`;
  let newLogic = `        const term = store.search().toLowerCase().trim();
        const statusF = store.statusFilter();
        let result = all;
        if (statusF === 'active') {
          result = result.filter(s => s.isActive !== false);
        } else if (statusF === 'inactive') {
          result = result.filter(s => s.isActive === false);
        }
        if (term) {
          result = result.filter(
            (s) =>
              s.name.toLowerCase().includes(term) ||
              s.email?.toLowerCase().includes(term) ||
              s.phoneNumber?.includes(term)
          );
        }
        return result;`;
  content = content.replace(oldLogic, newLogic);

  // Add setStatusFilter method
  let methodLogic = `    withMethods((store, api = inject(SupplierService)) => ({
      setStatusFilter(statusFilter: string) {
        patchState(store, { statusFilter, pageIndex: 1 });
      },`;
  content = content.replace('    withMethods((store, api = inject(SupplierService)) => ({', methodLogic);

  fs.writeFileSync(storePath, content);
  console.log('supplier.store.ts updated');
}
