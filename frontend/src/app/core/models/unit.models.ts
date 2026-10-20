export interface UnitListItemDto {
  id: number; name: string; description?: string | null; rowVersion: string;
  createdAtUtc?: string; updatedAtUtc?: string | null;
}
export interface UnitDetailDto extends UnitListItemDto {}
export interface ListUnitsQuery {
  filters?: string; search?: string | null; page?: number; pageSize?: number; }
export interface CreateUnitBody { name: string; description: string | null; }
export interface UpdateUnitBody extends CreateUnitBody { id: number; rowVersion: string; }
