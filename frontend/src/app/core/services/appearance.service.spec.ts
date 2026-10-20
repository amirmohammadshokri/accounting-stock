import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AppearanceService, contrastColor, DEFAULT_APPEARANCE } from './appearance.service';
import { AuthService } from './auth.service';

describe('AppearanceService', () => {
  const user = signal({ id: 901 });
  let originalStyle: string | null;
  let originalTheme: string | undefined;
  beforeEach(() => {
    originalStyle = document.documentElement.getAttribute('style');
    originalTheme = document.documentElement.dataset['theme'];
    for (const id of [901, 902]) localStorage.removeItem(`accounting.appearance.${id}`);
    user.set({ id: 901 });
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: { currentUser: user } }] });
  });
  afterEach(() => {
    for (const id of [901, 902]) localStorage.removeItem(`accounting.appearance.${id}`);
    if (originalStyle == null) document.documentElement.removeAttribute('style'); else document.documentElement.setAttribute('style', originalStyle);
    if (originalTheme == null) delete document.documentElement.dataset['theme']; else document.documentElement.dataset['theme'] = originalTheme;
  });
  it('persists mode and color separately for each signed-in account', () => {
    const service = TestBed.inject(AppearanceService);
    TestBed.flushEffects();
    service.setMode('dark'); service.setColor('#123456');
    TestBed.flushEffects();
    expect(service.dark()).toBeTrue();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    user.set({ id: 902 }); TestBed.flushEffects();
    expect(service.preferences().color).toBe('#00796b');
    expect(service.preferences().mode).toBe('light');
    user.set({ id: 901 }); TestBed.flushEffects();
    expect(service.preferences()).toEqual({ ...DEFAULT_APPEARANCE, mode: 'dark', color: '#123456' });
  });
  it('rejects invalid colors and chooses readable text on bright and dark accents', () => {
    const service = TestBed.inject(AppearanceService); TestBed.flushEffects();
    service.setColor('url(example.com)');
    expect(service.preferences().color).toBe('#00796b');
    expect(contrastColor('#ffffff')).toBe('#000000');
    expect(contrastColor('#000000')).toBe('#ffffff');
    service.setColor('#ffffff'); TestBed.flushEffects();
    expect(document.documentElement.style.getPropertyValue('--mat-sys-on-primary')).toBe('#000000');
  });
  it('restores old theme preferences and gives them a readable default background',()=>{
    localStorage.setItem('accounting.appearance.901',JSON.stringify({mode:'light',color:'#123456'}));
    const service=TestBed.inject(AppearanceService);TestBed.flushEffects();
    expect(service.preferences().backgroundColor).toBe(DEFAULT_APPEARANCE.backgroundColor);
    expect(service.preferences().color).toBe('#123456');
  });
  it('persists an independent background for each account and supports solid and dark styles',()=>{
    const service=TestBed.inject(AppearanceService);TestBed.flushEffects();
    service.setBackgroundColor('#efdfc7');service.setBackgroundStyle('solid');TestBed.flushEffects();
    expect(service.preferences().color).toBe(DEFAULT_APPEARANCE.color);
    expect(document.documentElement.style.getPropertyValue('--app-workspace-image')).toBe('none');
    user.set({id:902});TestBed.flushEffects();
    expect(service.preferences().backgroundColor).toBe(DEFAULT_APPEARANCE.backgroundColor);
    user.set({id:901});TestBed.flushEffects();
    expect(service.preferences().backgroundColor).toBe('#efdfc7');
    expect(service.preferences().backgroundStyle).toBe('solid');
    service.setMode('dark');service.setBackgroundStyle('soft');TestBed.flushEffects();
    expect(document.documentElement.style.getPropertyValue('--app-workspace-image')).toContain('#efdfc7');
    expect(document.documentElement.style.getPropertyValue('--app-workspace')).toContain('#101b25');
    service.setBackgroundColor('url(https://example.com)');TestBed.flushEffects();
    expect(service.preferences().backgroundColor).toBe('#efdfc7');
    service.resetBackground();expect(service.preferences().mode).toBe('dark');
    expect(service.preferences().backgroundColor).toBe(DEFAULT_APPEARANCE.backgroundColor);
  });

});
