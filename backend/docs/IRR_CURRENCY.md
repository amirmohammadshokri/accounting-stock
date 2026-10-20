# Iranian rial currency policy

The backend accepts only Iranian rial (`IRR`). Amounts are rial, not toman.
Invoices, orders, payments, cheques and cash/bank accounts default to IRR.
Currency inputs accept case and surrounding whitespace normalization; foreign
codes are rejected. Invoice exchange rates must be 1. Existing API currency
fields are retained for client compatibility. Clients should send IRR only.
Excel exports display IRR as ریال ایران.

The migration `20261014000000_UseIranianRialDefault` changes the cheque database
default only. It does not convert or relabel existing financial records, and
has not been applied to a running database by this change.

Before using an existing database, review foreign-currency records with the
read-only query below. Historical records remain readable, but saving changes
to them is blocked until a deliberate financial conversion is completed.
Do not use aggregate reports as rial totals while foreign records remain.

```sql
SELECT 'Invoices' AS Entity, Currency, COUNT_BIG(*) AS Records FROM Invoices GROUP BY Currency
UNION ALL SELECT 'Orders', Currency, COUNT_BIG(*) FROM Orders GROUP BY Currency
UNION ALL SELECT 'Payments', Currency, COUNT_BIG(*) FROM Payments GROUP BY Currency
UNION ALL SELECT 'Cheques', Currency, COUNT_BIG(*) FROM Cheques GROUP BY Currency
UNION ALL SELECT 'CashBankAccounts', Currency, COUNT_BIG(*) FROM CashBankAccounts GROUP BY Currency;
```

Run the focused regression checks (no database connection required):

```powershell
dotnet run --project backend/docs/tests/RialCurrency/RialCurrency.csproj
```
