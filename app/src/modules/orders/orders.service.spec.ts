import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  it('should mark order as PARTIAL_RECEIVED when remaining quantity exists', async () => {
    const tx = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'o1',
          status: OrderStatus.ORDERED,
          items: [
            { id: 'oi1', productId: 'p1', quantity: 10, receivedQuantity: 0 },
          ],
        }),
        update: jest.fn().mockResolvedValue({ id: 'o1', status: OrderStatus.PARTIAL_RECEIVED }),
      },
      orderItem: {
        update: jest.fn().mockResolvedValue({}),
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'oi1', productId: 'p1', quantity: 10, receivedQuantity: 4 }]),
      },
      product: {
        update: jest.fn().mockResolvedValue({}),
      },
      stockMovement: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (cb: (arg: unknown) => Promise<unknown>) => cb(tx)),
    } as unknown;

    const service = new OrdersService(prisma as never);
    const result = await service.receive('o1', {
      items: [{ productId: 'p1', quantity: 4 }],
    });

    expect(result.data.status).toBe(OrderStatus.PARTIAL_RECEIVED);
  });
});
