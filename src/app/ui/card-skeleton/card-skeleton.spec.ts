import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardSkeleton } from './card-skeleton';

describe('CardSkeleton', () => {
  let fixture: ComponentFixture<CardSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(CardSkeleton);
  });

  it('should size kpi stat-card-skeleton to match stat-card metrics without 150px min-height', () => {
    fixture.componentRef.setInput('type', 'kpi');
    fixture.detectChanges();

    const card: HTMLElement | null = fixture.nativeElement.querySelector('.stat-card-skeleton');
    const header: HTMLElement | null = fixture.nativeElement.querySelector('.stat-card-header-sk');
    const body: HTMLElement | null = fixture.nativeElement.querySelector('.stat-card-body-sk');

    expect(card).toBeTruthy();
    expect(header).toBeTruthy();
    expect(body).toBeTruthy();

    const cardStyle = getComputedStyle(card!);
    const headerStyle = getComputedStyle(header!);
    const bodyStyle = getComputedStyle(body!);

    expect(cardStyle.display).toBe('flex');
    expect(cardStyle.flexDirection).toBe('column');
    expect(cardStyle.minHeight).not.toBe('150px');
    expect(cardStyle.paddingTop).toBe('12px');
    expect(cardStyle.paddingBottom).toBe('12px');
    expect(cardStyle.paddingLeft).toBe('16px');
    expect(cardStyle.paddingRight).toBe('16px');
    expect(cardStyle.borderRadius).toBe('16px');
    expect(cardStyle.overflow).toBe('hidden');
    expect(headerStyle.marginBottom).toBe('8px');
    expect(bodyStyle.gap).toBe('4px');
  });
});

