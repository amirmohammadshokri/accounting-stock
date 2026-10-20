
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Accounting.Application.Common.Abstractions;

public interface IExcelService
{
    Task<byte[]> ExportAsync<T>(IEnumerable<T> data, string sheetName);
}
