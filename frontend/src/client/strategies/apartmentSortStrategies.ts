import type { Apartment } from '@/shared/types';

/**
 * Strategy Pattern: Strategy Interface for client-side apartment sorting.
 */
export interface ApartmentSortStrategy {
  readonly key: string;
  sort(apartments: Apartment[]): Apartment[];
}

/**
 * Concrete Strategy: Sorts by newest creation date descending.
 */
export class NewestSortStrategy implements ApartmentSortStrategy {
  readonly key = 'newest';

  sort(apartments: Apartment[]): Apartment[] {
    return apartments.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
}

/**
 * Concrete Strategy: Sorts by price low to high (ascending).
 */
export class PriceLowToHighSortStrategy implements ApartmentSortStrategy {
  readonly key = 'price-asc';

  sort(apartments: Apartment[]): Apartment[] {
    return apartments.sort((a, b) => a.price - b.price);
  }
}

/**
 * Concrete Strategy: Sorts by price high to low (descending).
 */
export class PriceHighToLowSortStrategy implements ApartmentSortStrategy {
  readonly key = 'price-desc';

  sort(apartments: Apartment[]): Apartment[] {
    return apartments.sort((a, b) => b.price - a.price);
  }
}

/**
 * Concrete Strategy: Sorts by floor area / size (largest first).
 */
export class LargestFloorAreaSortStrategy implements ApartmentSortStrategy {
  readonly key = 'size';

  sort(apartments: Apartment[]): Apartment[] {
    return apartments.sort((a, b) => b.size - a.size);
  }
}

/**
 * Strategy Pattern: Context for executing sorting strategy.
 */
const sortStrategyRegistry: Record<string, ApartmentSortStrategy> = {
  'newest': new NewestSortStrategy(),
  'price-asc': new PriceLowToHighSortStrategy(),
  'price-desc': new PriceHighToLowSortStrategy(),
  'size': new LargestFloorAreaSortStrategy(),
};

export function executeApartmentSort(sortKey: string, apartments: Apartment[]): Apartment[] {
  const strategy = sortStrategyRegistry[sortKey] || sortStrategyRegistry['newest'];
  return strategy.sort(apartments);
}
