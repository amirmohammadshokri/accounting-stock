import { Injectable, signal } from '@angular/core';

export interface ActiveBranch { id: number; name: string; isHeadquarters: boolean; userId: number; }

@Injectable({providedIn: 'root'})
export class BranchContextService {
  readonly active = signal<ActiveBranch | null>(this.restore());
  readonly allBranches = signal(false);
  readonly canViewAll = signal(false);

  private restore(): ActiveBranch | null {
    try {
      const branch = JSON.parse(sessionStorage.getItem('activeBranch') ?? 'null');
      const user = JSON.parse(localStorage.getItem('currentUser') ?? 'null');
      return branch?.userId === user?.id && branch?.id > 0 && !!localStorage.getItem('accessToken') ? branch : null;
    } catch { return null; }
  }

  select(branch: Omit<ActiveBranch, 'userId'>, userId: number, canViewAll: boolean): void {
    const active = {...branch, userId};
    sessionStorage.setItem('activeBranch', JSON.stringify(active));
    sessionStorage.setItem('branchCanViewAll', JSON.stringify(canViewAll));
    sessionStorage.removeItem('branchListScope');
    this.allBranches.set(false);
    this.active.set(active);
    this.canViewAll.set(canViewAll);
  }

  clear(): void {
    sessionStorage.removeItem('activeBranch');
    sessionStorage.removeItem('branchCanViewAll');
    this.active.set(null);
    this.canViewAll.set(false);
    this.allBranches.set(false);
    sessionStorage.removeItem('branchListScope');
  }

  constructor() {
    this.canViewAll.set(this.active() !== null && sessionStorage.getItem('branchCanViewAll') === 'true');
    this.allBranches.set(this.canViewAll() && sessionStorage.getItem('branchListScope') === 'all');
  }
}
