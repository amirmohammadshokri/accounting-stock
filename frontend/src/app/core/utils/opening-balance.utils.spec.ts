import { FormControl } from '@angular/forms';
import { OpeningBalance } from '../models/opening-balance.models';
import { parseOpeningJson,openingDayToUtc,openingDateValidator,openingDecimalValidator,openingTotal } from './opening-balance.utils';
import { StockMovementType,getMovementTypeDisplayName,isInboundMovement } from '../models/stock-movement.models';
describe('Opening balance precision and financial dates',()=>{
  it('preserves decimals larger than Number safe integer and leaves quoted note text alone',()=>{
    const row=parseOpeningJson('{"id":1,"branchId":2,"amount":9007199254740993.01,"unitCost":0,"quantity":1e-3,"totalCost":null,"note":"123 \\"quoted\\" 4.5","isDebit":false}') as OpeningBalance;
    expect(row.amount).toBe('9007199254740993.01');expect(row.id).toBe(1);expect(row.unitCost).toBe('0');expect(row.quantity).toBe('0.001');expect(row.totalCost).toBeNull();expect(row.isDebit).toBeFalse();expect(row.note).toBe('123 "quoted" 4.5');
  });
  it('uses UTC midnight without changing the selected Gregorian day',()=>{
    expect(openingDayToUtc('2026-10-17')).toBe('2026-10-17T00:00:00Z');
    expect(()=>openingDayToUtc('2026-02-30')).toThrow();
    expect(openingDateValidator(new FormControl('2999-01-01'))).toEqual({futureDate:true});
  });
  it('validates decimal scales and keeps unknown valuation distinct from zero',()=>{
    const cost=openingDecimalValidator(4,'99999999999999.9999',true,true);
    expect(cost(new FormControl(''))).toBeNull();expect(cost(new FormControl('0'))).toBeNull();expect(cost(new FormControl('-1'))).not.toBeNull();
    expect(cost(new FormControl('1.12345'))).not.toBeNull();
    expect(openingDecimalValidator(2,'9999999999999999.99')(new FormControl('9007199254740993.01'))).toBeNull();
    expect(openingDecimalValidator(3,'999999999999999.999')(new FormControl('0'))).not.toBeNull();
    expect(openingTotal('10','')).toBeNull();expect(openingTotal('10','0')).toBe('0.00');expect(openingTotal('1','2.675')).toBe('2.68');
    expect(openingTotal('3','9007199254740.0001')).toBe('27021597764220.00');
  });
  it('recognizes OpeningBalance as an incoming movement',()=>{
    expect(getMovementTypeDisplayName(StockMovementType.OpeningBalance)).toBe('موجودی اول دوره');expect(isInboundMovement(StockMovementType.OpeningBalance)).toBeTrue();
  });
});
