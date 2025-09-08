export interface LendingItem {
  id: number;
  title: string;
  status: "Listed" | "Unlisted" | "LendOut";
  listedDate: string;
  dueDate?: string;
  overdue?: boolean;
}

export type LendingStatus = "Listed" | "Unlisted" | "LendOut";
export type FilterStatus = "all" | LendingStatus;