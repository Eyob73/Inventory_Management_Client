const fs = require('fs');

let storePath = 'src/app/store/purchase.store.ts';
let content = fs.readFileSync(storePath, 'utf8');

// Add statusFilter to state
content = content.replace("search: '',", "search: '',\n      statusFilter: '',");

// Update interface if exists (wait, it's inside signalStore)
content = content.replace("search: string;", "search: string;\n    statusFilter: string;");

// Update filtered logic
let oldLogic = `        const term = store.search().toLowerCase().trim();
        if (!term) return all;
        return all.filter(
          (p) =>
            p.purchaseNumber.toLowerCase().includes(term) ||
            (p.supplierName || '').toLowerCase().includes(term) ||
            p.status.toLowerCase().includes(term)
        );`;
let newLogic = `        const term = store.search().toLowerCase().trim();
        const statusF = store.statusFilter();
        let result = all;
        if (statusF) {
          result = result.filter(p => p.status === statusF);
        }
        if (term) {
          result = result.filter(
            (p) =>
              p.purchaseNumber.toLowerCase().includes(term) ||
              (p.supplierName || '').toLowerCase().includes(term) ||
              p.status.toLowerCase().includes(term)
          );
        }
        return result;`;
content = content.replace(oldLogic, newLogic);

// Add setStatusFilter method
let methodLogic = `    withMethods((store, api = inject(PurchaseService)) => ({
      setStatusFilter(statusFilter: string) {
        patchState(store, { statusFilter, pageIndex: 1 });
      },`;
content = content.replace('    withMethods((store, api = inject(PurchaseService)) => ({', methodLogic);

fs.writeFileSync(storePath, content);
console.log('purchase.store.ts updated');
