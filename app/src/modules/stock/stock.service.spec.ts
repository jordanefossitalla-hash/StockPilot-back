import { StockService } from './stock.service';
import { StockInsufficientException } from './exceptions';

describe('StockService', () => {
  it('should throw STOCK_INSUFFICIENT on exit when quantity is unavailable', async () => {
    const tx = {
      product: {
        findUnique: jest.fn().mockResolvedValue({ id: 'p1', stockQuantity: 2 }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      stockMovement: {
        create: jest.fn(),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (cb: (arg: unknown) => Promise<unknown>) => cb(tx)),
    } as unknown;

    const service = new StockService(prisma as never);

    await expect(
      service.createExit({ productId: 'p1', quantity: 5, note: 'test' }),
    ).rejects.toBeInstanceOf(StockInsufficientException);
  });
});
