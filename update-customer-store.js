const fs = require('fs');

let storePath = 'src/app/store/customer.store.ts';
let content = fs.readFileSync(storePath, 'utf8');

if (!content.includes('statusFilter: string')) {
  // Add statusFilter to state
  content = content.replace("search: '',", "search: '',\n      statusFilter: 'all',");

  // Update interface if exists
  content = content.replace("search: string;", "search: string;\n    statusFilter: 'all' | 'active' | 'inactive';");
  
  let match = content.match(/search: '',/);
  if (!match) {
     content = content.replace("search: ''", "search: '',\n      statusFilter: 'all'");
  }

  // Update filtered logic
  let oldLogic = `        const term = store.search().toLowerCase().trim();
        if (!term) return all;
        return all.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.phoneNumber?.includes(term)
        );`;
  let newLogic = `        const term = store.search().toLowerCase().trim();
        const statusF = store.statusFilter();
        let result = all;
        if (statusF === 'active') {
          result = result.filter(c => c.isActive !== false);
        } else if (statusF === 'inactive') {
          result = result.filter(c => c.isActive === false);
        }
        if (term) {
          result = result.filter(
            (c) =>
              c.name.toLowerCase().includes(term) ||
              c.email?.toLowerCase().includes(term) ||
              c.phoneNumber?.includes(term)
          );
        }
        return result;`;
  content = content.replace(oldLogic, newLogic);

  // Add setStatusFilter method
  let methodLogic = `    withMethods((store, api = inject(CustomerService)) => ({
      setStatusFilter(statusFilter: string) {
        patchState(store, { statusFilter, pageIndex: 1 });
      },`;
  content = content.replace('    withMethods((store, api = inject(CustomerService)) => ({', methodLogic);

  fs.writeFileSync(storePath, content);
  console.log('customer.store.ts updated');
}
