import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTransloco } from '@jsverse/transloco';
import { vi } from 'vitest';
import { DataViewComponent } from './data-view.component';

describe('DataViewComponent', () => {
  let fixture: ComponentFixture<DataViewComponent>;
  let component: DataViewComponent;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [DataViewComponent],
      providers: [
        provideNoopAnimations(),
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DataViewComponent);
    component = fixture.componentInstance;
    component.pageName = 'products';
    component.cardFields = [{ key: 'name', label: 'Name', type: 'text' }];
    component.data = [{ id: '1', name: 'Test Product' }];
    component.viewMode.set('card');
  });

  it('should render data cards without mobile tap-highlight and preserve surface background', () => {
    const clickSpy = vi.fn();
    const sub = component.cardClicked.subscribe(clickSpy);
    fixture.detectChanges();

    const card: HTMLElement | null = fixture.nativeElement.querySelector('.data-card');
    const content: HTMLElement | null = fixture.nativeElement.querySelector('.data-card-content');
    expect(card).toBeTruthy();
    expect(content).toBeTruthy();
    expect(card!.classList.contains('data-card--clickable')).toBe(true);

    const cardStyle = getComputedStyle(card!);
    const contentStyle = getComputedStyle(content!);
    expect(cardStyle.touchAction).toBe('manipulation');
    expect(cardStyle.userSelect).toBe('none');
    expect(cardStyle.background || cardStyle.backgroundColor).toContain('var(--surface');
    expect(contentStyle.touchAction).toBe('manipulation');

    const componentCss = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(componentCss).toMatch(/\.data-card[\s\S]*-webkit-tap-highlight-color:\s*transparent/);
    expect(componentCss).toMatch(/\.data-card-content[\s\S]*-webkit-tap-highlight-color:\s*transparent/);

    content!.click();
    expect(clickSpy).toHaveBeenCalledWith({ id: '1', name: 'Test Product' });
    sub.unsubscribe();
  });
});

