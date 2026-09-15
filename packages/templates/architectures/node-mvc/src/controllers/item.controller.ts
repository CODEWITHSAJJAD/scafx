import { Request, Response } from 'express';
import { ItemModel } from '../models/item.model.js';
import { renderItemList } from '../views/item.view.js';

const items: ItemModel[] = [
  {
    id: '1',
    name: 'Sample Entity',
    description: 'Scaffolded via scafx MVC architecture',
    createdAt: new Date(),
  },
];

export function getItems(req: Request, res: Response): void {
  if (req.headers.accept?.includes('text/html')) {
    res.send(renderItemList(items));
  } else {
    res.json({ success: true, data: items });
  }
}
