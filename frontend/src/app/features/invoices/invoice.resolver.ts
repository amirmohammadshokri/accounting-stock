import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { InvoicesService } from '../../core/services/invoices.service';

export const invoiceResolver: ResolveFn<any> = (route) => {
  const id = Number(route.paramMap.get('id'));
  if (!id) return null;
  return inject(InvoicesService).getById(id);
};
