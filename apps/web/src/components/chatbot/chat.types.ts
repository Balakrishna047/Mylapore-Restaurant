export interface CategoryButton {
  id: string;
  name: string;
  slug: string;
  icon: string;
  itemCount: number;
  actionPayload: {
    type: 'FILTER_CATEGORY';
    categorySlug: string;
    categoryName: string;
  };
}

export interface MenuItemCardData {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  priceFormatted: string;
  priceMinor: number;
  currency: string;
  categoryName: string;
  dietaryTags: string[];
  spiceLevel: string;
  isBlastChilled: boolean;
  orderCountBadge?: string;
  actionPayload: {
    type: 'VIEW_ITEM_DETAIL';
    itemId: string;
    itemSlug: string;
  };
}

export interface MenuItemDetailData {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  priceFormatted: string;
  priceMinor: number;
  currency: string;
  categoryName: string;
  dietaryTags: string[];
  spiceLevel: string;
  allergens: string[];
  ingredients: string[];
  nutritionServing: string;
  reheatingInstructions: string;
  isBlastChilled: boolean;
}

export type DisplayBlockPayload =
  | { categories: CategoryButton[] }
  | { items: MenuItemCardData[]; count: number }
  | MenuItemDetailData;

export interface ChatDisplayBlock {
  id?: string;
  turnId?: string;
  requestId?: string;
  catalogVersion?: string;
  type: 'category_buttons' | 'menu_item_list' | 'menu_item_detail';
  payload: any;
  createdAt?: string | Date;
  expiresAt?: string | Date;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
  displayBlocks?: ChatDisplayBlock[];
}

export interface ChatSessionState {
  sessionToken: string | null;
  sessionId: string | null;
  status: string;
  outletId: string;
}
