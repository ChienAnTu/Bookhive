import { ComplaintType } from "./order";

export interface ComplaintTypeOption {
  value: ComplaintType;
  label: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

// Predefined tags for reviews
export const reviewTags = [
  'Excellent communication',
  'Fast response',
  'Book in great condition',
  'Easy pickup/delivery',
  'Very reliable',
  'Friendly person',
  'Flexible timing',
  'Professional',
];