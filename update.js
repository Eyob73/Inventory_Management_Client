const fs = require('fs');

let html = fs.readFileSync('src/app/features/system-admin/add-company/add-company.html', 'utf8');

html = "<ng-container *transloco=\"let t; read: 'systemAdmin'\">\n" + html + "\n</ng-container>";

html = html.replace('<h1 class="page-title">Add Company</h1>', "<h1 class=\"page-title\">{{ t('addCompany.title') }}</h1>");
html = html.replace('<p class="page-subtitle">Register a new tenant company and its initial administrator.</p>', "<p class=\"page-subtitle\">{{ t('addCompany.subtitle') }}</p>");
html = html.replace('<h2 class="card-title">Company Information</h2>', "<h2 class=\"card-title\">{{ t('addCompany.companyInfo') }}</h2>");
html = html.replace('<mat-label>Company Name</mat-label>', "<mat-label>{{ t('addCompany.companyName') }}</mat-label>");
html = html.replace('placeholder="e.g. ABC Store"', "[placeholder]=\"t('addCompany.namePlaceholder')\"");
html = html.replace('Name is required', "{{ t('addCompany.nameRequired') }}");
html = html.replace('<mat-label>Company Code</mat-label>', "<mat-label>{{ t('addCompany.companyCode') }}</mat-label>");
html = html.replace('placeholder="e.g. ABC001"', "[placeholder]=\"t('addCompany.codePlaceholder')\"");
html = html.replace('Code is required', "{{ t('addCompany.codeRequired') }}");
html = html.replace('<mat-label>Contact Email</mat-label>', "<mat-label>{{ t('addCompany.contactEmail') }}</mat-label>");
html = html.replace('placeholder="contact@abc.com"', "[placeholder]=\"t('addCompany.emailPlaceholder')\"");
html = html.replace('<mat-label>Contact Phone</mat-label>', "<mat-label>{{ t('addCompany.contactPhone') }}</mat-label>");
html = html.replace('placeholder="+1 234 567 890"', "[placeholder]=\"t('addCompany.phonePlaceholder')\"");
html = html.replace('<mat-label>Address</mat-label>', "<mat-label>{{ t('addCompany.address') }}</mat-label>");
html = html.replace('placeholder="Company address"', "[placeholder]=\"t('addCompany.addressPlaceholder')\"");
html = html.replace('<mat-label>Description</mat-label>', "<mat-label>{{ t('addCompany.description') }}</mat-label>");
html = html.replace('placeholder="Additional details"', "[placeholder]=\"t('addCompany.descriptionPlaceholder')\"");
html = html.replace('<h2 class="card-title">Initial Company Administrator</h2>', "<h2 class=\"card-title\">{{ t('addCompany.adminInfo') }}</h2>");
html = html.replace('<mat-label>First Name</mat-label>', "<mat-label>{{ t('addCompany.firstName') }}</mat-label>");
html = html.replace('First name required', "{{ t('addCompany.firstNameRequired') }}");
html = html.replace('<mat-label>Last Name</mat-label>', "<mat-label>{{ t('addCompany.lastName') }}</mat-label>");
html = html.replace('Last name required', "{{ t('addCompany.lastNameRequired') }}");
html = html.replace('<mat-label>Admin Email (Username)</mat-label>', "<mat-label>{{ t('addCompany.adminEmail') }}</mat-label>");
html = html.replace('Email required', "{{ t('addCompany.emailRequired') }}");
html = html.replace('Must be valid email', "{{ t('addCompany.validEmail') }}");
html = html.replace('<mat-label>Password</mat-label>', "<mat-label>{{ t('addCompany.password') }}</mat-label>");
html = html.replace('Password required', "{{ t('addCompany.passwordRequired') }}");
html = html.replace('Min 8 characters', "{{ t('addCompany.min8Chars') }}");
html = html.replace('<mat-label>Confirm Password</mat-label>', "<mat-label>{{ t('addCompany.confirmPassword') }}</mat-label>");
html = html.replace('Passwords do not match', "{{ t('addCompany.passwordsMismatch') }}");
html = html.replace('>Cancel</button>', ">{{ t('common.cancel') }}</button>");
html = html.replace('Create Company', "{{ t('addCompany.createCompany') }}");

fs.writeFileSync('src/app/features/system-admin/add-company/add-company.html', html);


let ts = fs.readFileSync('src/app/features/system-admin/add-company/add-company.ts', 'utf8');

ts = ts.replace("import { MatSnackBar } from '@angular/material/snack-bar';", "import { MatSnackBar } from '@angular/material/snack-bar';\nimport { TranslocoService, TranslocoModule } from '@jsverse/transloco';");
ts = ts.replace(/imports: \[\s*CommonModule,/, "imports: [\n    TranslocoModule,\n    CommonModule,");
ts = ts.replace("private snackBar = inject(MatSnackBar);", "private snackBar = inject(MatSnackBar);\n  private transloco = inject(TranslocoService);");

ts = ts.replace("'Company created successfully.'", "this.transloco.translate('systemAdmin.addCompany.createSuccess')");
ts = ts.replace(/'Close'/g, "this.transloco.translate('systemAdmin.common.close')");
ts = ts.replace("'Failed to create company'", "this.transloco.translate('systemAdmin.addCompany.createFailed')");
ts = ts.replace("'Failed'", "this.transloco.translate('systemAdmin.common.failed')");

fs.writeFileSync('src/app/features/system-admin/add-company/add-company.ts', ts);
console.log('add-company done');
