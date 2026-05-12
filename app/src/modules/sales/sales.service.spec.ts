import { SalesService } from './sales.service';
import { StockInsufficientException } from '../stock/exceptions';

describe('SalesService', () => {
  it('should throw STOCK_INSUFFICIENT when creating sale with missing stock', async () => {
    const tx = {
      product: {
        findMany: jest.fn().mockResolvedValue([{ id: 'p1' }]),
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
