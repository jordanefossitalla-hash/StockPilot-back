import { SalesService } from './sales.service';
import { StockInsufficientException } from '../stock/exceptions';

describe('SalesService', () => {
  it('should snapshot product cost and profit totals when creating sale', async () => {
    const tx = {
      product: {
        findMany: jest.fn().mockResolvedValue([{ id: 'p1', costPrice: 60 }]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      sale: {
        create: jest.fn().mockResolvedValue({ id: 's1' }),
      },
      saleItem: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      stockMovement: {
        create: jest.fn().mockResolvedValue({}),
      },
      salePayment: {
        create: jest.fn().mockResolvedValue({}),
      },
      client: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (cb: (arg: unknown) => Promise<unknown>) => cb(tx)),
      sale: {
        findUnique: jest.fn().mockResolvedValue({
          id: 's1',
          items: [],
          payments: [],
          clientOrder: null,
        }),
      },
    } as unknown;

    const service = new SalesService(prisma as never);

    await service.create({
      clientId: 'c1',
      items: [{ productId: 'p1', quantity: 2, unitPrice: 100 }],
      paidAmount: 50,
    });

    expect(tx.sale.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        total: 200,
        costTotal: 120,
        profitTotal: 80,
      }),
    });
    expect(tx.saleItem.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          unitCostSnapshot: 60,
          lineTotal: 200,
          lineCostTotal: 120,
          lineProfit: 80,
        }),
      ],
    });
  });

  it('should throw STOCK_INSUFFICIENT when creating sale with missing stock', async () => {
    const tx = {
      product: {
      findMany: jest.fn().mockResolvedValue([{ id: 'p1', costPrice: 25 }]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      sale: {
        create: jest.fn().mockResolvedValue({ id: 's1' }),
      },
      saleItem: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      stockMovement: {
        create: jest.fn(),
      },
      salePayment: {
        create: jest.fn(),
      },
			client: {
				update: jest.fn(),
			},
    };

    const prisma = {
      $transaction: jest.fn(async (cb: (arg: unknown) => Promise<unknown>) => cb(tx)),
      sale: {
        findUnique: jest.fn(),
      },
    } as unknown;

    const service = new SalesService(prisma as never);

    await expect(
      service.create({
        clientId: 'c1',
        items: [{ productId: 'p1', quantity: 2, unitPrice: 100 }],
        paidAmount: 0,
      }),
    ).rejects.toBeInstanceOf(StockInsufficientException);
  });
});
