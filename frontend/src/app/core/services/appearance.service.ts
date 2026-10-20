import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

export type ThemeMode = 'light' | 'dark' | 'system';
export type BackgroundStyle = 'soft' | 'solid';
export interface Appearance { mode: ThemeMode; color: string; backgroundColor: string; backgroundStyle: BackgroundStyle; }
export const DEFAULT_APPEARANCE: Appearance = { mode: 'light', color: '#00796b', backgroundColor: '#cfe5de', backgroundStyle: 'soft' };

export function contrastColor(hex: string): string {
  const channels = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 > 0.179 ? '#000000' : '#ffffff';
}

@Injectable({ providedIn: 'root' })
export class AppearanceService {
  private document = inject(DOCUMENT);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private media = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');
  private systemDark = signal(this.media?.matches ?? false);
  readonly preferences = signal<Appearance>({ ...DEFAULT_APPEARANCE });
  readonly dark = computed(() => this.preferences().mode === 'dark' || (this.preferences().mode === 'system' && this.systemDark()));
  readonly presets = [
    { name: 'سبزآبی', color: '#00796b' }, { name: 'نیلی', color: '#3949ab' },
    { name: 'آبی', color: '#1565c0' }, { name: 'بنفش', color: '#7b1fa2' },
    { name: 'زرشکی', color: '#ad1457' }, { name: 'نارنجی', color: '#b45309' }
  ];

  readonly backgroundPresets = [
    {name:'نعنایی',color:'#cfe5de'},{name:'آبی آسمانی',color:'#cfdef1'},{name:'یاسی',color:'#e1d6ef'},
    {name:'کرم گرم',color:'#efdfc7'},{name:'صورتی ملایم',color:'#efd5dc'},{name:'خاکستری',color:'#d6dde3'}
  ];

  constructor() {
    effect(() => {
      const key = this.storageKey();
      let saved: Partial<Appearance> = {};
      try { saved = JSON.parse(this.document.defaultView?.localStorage.getItem(key) ?? '{}'); } catch { /* Use defaults if storage is unavailable. */ }
      this.preferences.set({
        mode: ['light', 'dark', 'system'].includes(saved?.mode ?? '') ? saved.mode! : DEFAULT_APPEARANCE.mode,
        color: /^#[\da-f]{6}$/i.test(saved?.color ?? '') ? saved.color! : DEFAULT_APPEARANCE.color,
        backgroundColor: /^#[\da-f]{6}$/i.test(saved?.backgroundColor ?? '') ? saved.backgroundColor! : DEFAULT_APPEARANCE.backgroundColor,
        backgroundStyle: saved?.backgroundStyle === 'solid' ? 'solid' : 'soft'
      });
    });
    effect(() => this.apply(this.preferences(), this.dark()));
    const listener = (event: MediaQueryListEvent) => this.systemDark.set(event.matches);
    this.media?.addEventListener('change', listener);
    this.destroyRef.onDestroy(() => this.media?.removeEventListener('change', listener));
  }
  setMode(mode: ThemeMode) { this.save({ ...this.preferences(), mode }); }
  setColor(color: string) { if (/^#[\da-f]{6}$/i.test(color)) this.save({ ...this.preferences(), color }); }
  setBackgroundColor(backgroundColor: string): void { if (/^#[\da-f]{6}$/i.test(backgroundColor)) this.save({ ...this.preferences(), backgroundColor }); }
  setBackgroundStyle(backgroundStyle: BackgroundStyle): void { if (backgroundStyle==='soft'||backgroundStyle==='solid') this.save({ ...this.preferences(), backgroundStyle }); }
  resetBackground(): void { this.save({...this.preferences(),backgroundColor:DEFAULT_APPEARANCE.backgroundColor,backgroundStyle:DEFAULT_APPEARANCE.backgroundStyle}); }
  reset() { this.save({ ...DEFAULT_APPEARANCE }); }
  private storageKey() { return `accounting.appearance.${this.auth.currentUser()?.id ?? 'guest'}`; }
  private save(preferences: Appearance) {
    this.preferences.set(preferences);
    try { this.document.defaultView?.localStorage.setItem(this.storageKey(), JSON.stringify(preferences)); } catch { /* The selected theme remains active in memory. */ }
  }
  private apply(preferences: Appearance, dark: boolean) {
    const { color, backgroundColor, backgroundStyle } = preferences;
    const root = this.document.documentElement;
    root.style.colorScheme = dark ? 'dark' : 'light';
    root.dataset['theme'] = dark ? 'dark' : 'light';
    const primary = dark ? `color-mix(in srgb, ${color} 40%, white)` : color;
    const tokens: Record<string, string> = {
      primary, 'on-primary': dark ? '#111827' : contrastColor(color),
      'primary-container': `color-mix(in srgb, ${color} ${dark ? '28%' : '14%'}, ${dark ? '#151b23' : 'white'})`,
      'on-primary-container': dark ? '#e6f5f1' : '#132b29',
      secondary: primary, 'on-secondary': dark ? '#111827' : contrastColor(color),
      'secondary-container': `color-mix(in srgb, ${color} ${dark ? '20%' : '9%'}, ${dark ? '#151b23' : 'white'})`,
      'on-secondary-container': dark ? '#e6f5f1' : '#132b29',
      'surface-tint': primary, 'inverse-primary': color,
      surface: dark ? '#111820' : '#f6f8fa',
      'surface-container-lowest': dark ? '#0b1118' : '#ffffff',
      'surface-container-low': dark ? '#18212b' : '#ffffff',
      'surface-container': dark ? '#1c2732' : '#f0f4f6',
      'surface-container-high': dark ? '#25313e' : '#e9eff2',
      'surface-container-highest': dark ? '#303c49' : '#e2e9ed',
      'on-surface': dark ? '#e5edf4' : '#192a37',
      'on-surface-variant': dark ? '#b8c7d4' : '#526370',
      outline: dark ? '#7b8c9a' : '#70818e',
      'outline-variant': dark ? '#3d4b58' : '#d5dfe5',
      error: dark ? '#ffb4ab' : '#b3261e',
      'error-container': dark ? '#6c2422' : '#ffdad6',
      'on-error-container': dark ? '#ffdad6' : '#410002'
    };
    for (const [token, value] of Object.entries(tokens)) root.style.setProperty(`--mat-sys-${token}`, value);
    root.style.setProperty('--app-accent', color);
    // Blend any chosen color with a theme-safe base so forms remain readable.
    const base = `color-mix(in srgb, ${backgroundColor} ${dark?'18%':'35%'}, ${dark?'#101b25':'#f6f8fb'})`;
    const glow = `color-mix(in srgb, ${backgroundColor} ${dark?'32%':'70%'}, ${dark?'#16232c':'#f6f8fb'})`;
    root.style.setProperty('--app-workspace', base);
    root.style.setProperty('--app-workspace-image', backgroundStyle==='solid'?'none':
      `radial-gradient(ellipse at top right, ${glow} 0, transparent 60%), linear-gradient(145deg, ${base}, ${dark?'#17232f':'#edf2f7'})`);
  }
}
