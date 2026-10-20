import { Directive, Injectable, inject } from '@angular/core';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { APP_ICONS } from './app-icons';

@Injectable({providedIn:'root'})
export class AppSvgIcons {
  constructor() {
    const registry=inject(MatIconRegistry);
    const sanitizer=inject(DomSanitizer);
    for (const [name,svg] of Object.entries(APP_ICONS)) {
      // Only checked-in, generated outlines are trusted; never accept user-provided SVG.
      registry.addSvgIconLiteral(name,sanitizer.bypassSecurityTrustHtml(svg));
    }
  }
}

// Registers local icons even when a standalone form is rendered in isolation or a test.
@Directive({standalone:true,selector:'mat-icon[svgIcon]'})
export class AppSvgIconDirective {
  private readonly icons=inject(AppSvgIcons);
}
export const APP_ICON_IMPORTS = [MatIconModule,AppSvgIconDirective] as const;
