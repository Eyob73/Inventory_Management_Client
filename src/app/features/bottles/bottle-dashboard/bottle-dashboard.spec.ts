import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { of } from 'rxjs';
import { BottleDashboardComponent } from './bottle-dashboard';
import { BottleReportsService } from '../../../core/services/bottle-reports';
import { BottleTransactionsService } from '../../../core/services/bottle-transactions';
import { BottleInventoryService } from '../../../core/services/bottle-inventory';
import { BottleTypesService } from '../../../core/services/bottle-types';
import { AuthStore } from '../../../store/auth.store';

describe('BottleDashboardComponent', () => {
  let component: BottleDashboardComponent;
  let fixture: ComponentFixture<BottleDashboardComponent>;

  beforeEach(async () => {
    const mockReportsService = {
      getDashboardStats: vi.fn().mockReturnValue(
        of({
          totalFullBottles: 120,
          totalEmptyBottles: 80,
          totalBottlesWithCustomers: 45,
          totalPendingDepositLiability: 4500,
        })
      ),
    };

    const mockTransactionsService = {
      getPagedTransactions: vi.fn().mockReturnValue(
        of({
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: 5,
        })
      ),
    };

    const mockInventoryService = {
      getPagedInventory: vi.fn().mockReturnValue(
        of({
          items: [
            {
              id: 'inv-1',
              bottleTypeId: 'type-1',
              bottleTypeName: '20L Water Dispenser Bottle',
              fullBottles: 120,
              emptyBottles: 80,
              damagedBottles: 2,
              lostBottles: 1,
              withCustomers: 45,
              lastUpdatedAt: new Date('2026-11-01T10:00:00Z'),
            },
          ],
          totalCount: 1,
          page: 1,
          pageSize: 100,
        })
      ),
    };

    const mockTypesService = {
      getPagedBottleTypes: vi.fn().mockReturnValue(
        of({
          items: [
            {
              id: 'type-1',
              name: '20L Water Dispenser Bottle',
              description: 'Standard polycarbonate bottle',
              depositAmount: 100,
              capacity: '20L',
              material: 'PC',
              isActive: true,
              createdAt: new Date('2026-01-01T00:00:00Z'),
            },
          ],
          totalCount: 1,
          page: 1,
          pageSize: 100,
        })
      ),
    };

    const mockAuthStore = {
      userRole: signal('Admin'),
    };

    await TestBed.configureTestingModule({
      imports: [BottleDashboardComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en',
            missingHandler: {
              logMissingKey: false,
            },
          },
        }),
        { provide: BottleReportsService, useValue: mockReportsService },
        { provide: BottleTransactionsService, useValue: mockTransactionsService },
        { provide: BottleInventoryService, useValue: mockInventoryService },
        { provide: BottleTypesService, useValue: mockTypesService },
        { provide: AuthStore, useValue: mockAuthStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BottleDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should frame bottle type inventory table inside .section-card > .table-card > .table-wrapper for clean horizontal scroll', () => {
    const sections = fixture.nativeElement.querySelectorAll('.section-card');
    expect(sections.length).toBe(2);

    const inventorySection: HTMLElement = sections[1];
    const tableCard: HTMLElement | null = inventorySection.querySelector(':scope > .table-card');
    const tableWrapper: HTMLElement | null = tableCard?.querySelector(':scope > .table-wrapper') ?? null;
    const table: HTMLTableElement | null = tableWrapper?.querySelector(':scope > table.app-table') ?? null;

    expect(tableCard).toBeTruthy();
    expect(tableWrapper).toBeTruthy();
    expect(table).toBeTruthy();
    expect(inventorySection.querySelectorAll('tbody tr').length).toBe(1);

    const sectionStyle = getComputedStyle(inventorySection);
    const cardStyle = getComputedStyle(tableCard!);
    const wrapperStyle = getComputedStyle(tableWrapper!);

    expect(sectionStyle.overflow).toBe('hidden');
    expect(cardStyle.overflow).toBe('hidden');
    expect(wrapperStyle.overflowX).toBe('auto');
    expect(wrapperStyle.overflowY).toBe('hidden');
    expect(wrapperStyle.marginLeft).toBe('0px');
    expect(wrapperStyle.marginRight).toBe('0px');
    expect(wrapperStyle.marginBottom).toBe('0px');
    expect(wrapperStyle.paddingLeft).toBe('0px');
    expect(wrapperStyle.paddingRight).toBe('0px');
    expect(wrapperStyle.paddingBottom).toBe('0px');
  });

  it('should display the stats-row stat cards in a two-column grid', () => {
    const statsRow: HTMLElement | null = fixture.nativeElement.querySelector('.stats-row');
    expect(statsRow).toBeTruthy();

    const cards = statsRow!.querySelectorAll('.stat-card');
    expect(cards.length).toBe(4);

    const statsRowStyle = getComputedStyle(statsRow!);
    expect(statsRowStyle.display).toBe('grid');
    expect(statsRowStyle.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
  });
});
