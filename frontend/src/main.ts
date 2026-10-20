import { PERSIAN_GRID } from './app/core/ag-grid/persian-grid';
import { ModuleRegistry, AllCommunityModule, provideGlobalGridOptions } from 'ag-grid-community';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// ✅ AG Grid v34 module registration (Community)
ModuleRegistry.registerModules([AllCommunityModule]);
provideGlobalGridOptions(PERSIAN_GRID, 'deep');

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
