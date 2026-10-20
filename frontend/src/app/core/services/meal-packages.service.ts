import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface MealPackageRow {
  itemId: number; quantity: number | string; unitPrice: number | string; vatRate: number;
  discountRate: number | string; withholdingRate: number;
  code?: string; name?: string; unit?: string; available?: boolean;
}
export interface MealPackage { id: number; name: string; rowVersion: string; lines: MealPackageRow[]; }
@Injectable({providedIn:'root'})
export class MealPackagesService {
  private http = inject(HttpClient);
  private url = `${environment.apiBaseUrl}/meal-packages`;
  list() { return this.http.get<MealPackage[]>(this.url); }
  save(name: string, lines: MealPackageRow[], existing?: MealPackage) {
    const body = {name, lines, rowVersion: existing?.rowVersion};
    return existing ? this.http.put<MealPackage>(`${this.url}/${existing.id}`, body) : this.http.post<MealPackage>(this.url, body);
  }
  delete(p: MealPackage) { return this.http.delete(`${this.url}/${p.id}`, {params:{rowVersion:p.rowVersion}}); }
}
