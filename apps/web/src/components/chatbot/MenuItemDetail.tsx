'use client';

import React from 'react';
import { MenuItemDetailData } from './chat.types';
import { MenuItemDetailModal } from './MenuItemDetailModal';

export interface MenuItemDetailProps {
  item: MenuItemDetailData | null;
  onClose: () => void;
}

/**
 * MenuItemDetail - Specification-compliant component presenting the
 * complete recipe, allergen matrix, blast-chilled freshness indicator,
 * and heating instructions for a selected dish.
 */
export const MenuItemDetail: React.FC<MenuItemDetailProps> = ({ item, onClose }) => {
  return <MenuItemDetailModal item={item} onClose={onClose} />;
};

export default MenuItemDetail;
