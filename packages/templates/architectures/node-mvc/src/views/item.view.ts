import { ItemModel } from '../models/item.model.js';

export function renderItemView(item: ItemModel): string {
  return `<div class="item-card"><h2>${item.name}</h2><p>${item.description}</p></div>`;
}

export function renderItemList(items: ItemModel[]): string {
  return `<div class="items-list">${items.map(renderItemView).join('')}</div>`;
}
