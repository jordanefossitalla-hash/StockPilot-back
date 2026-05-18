import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientOrderDeliveryStatus, ClientOrderPriority, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ClientOrdersStatsQueryDto } from './dto/client-orders-stats-query.dto';
import { CreateClientOrderDto } from './dto/create-client-order.dto';
import { ListClientOrdersQueryDto } from './dto/list-client-orders-query.dto';
import { UpdateClientOrderDeliveryStatusDto } from './dto/update-client-order-delivery-status.dto';
import { UpdateClientOrderPriorityDto } from './dto/update-client-order-priority.dto';

@Injectable()
export class ClientOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListClientOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ClientOrderWhereInput = {
      clientId: query.clientId,
      deliveryStatus: query.deliveryStatus as ClientOrderDeliveryStatus | undefined,
      priority: query.priority as ClientOrderPriority | undefined,
      deliveryDueAt:
        query.from || query.to
          ? {
              gte: query.from ? new Date(query.from) : undefined,
              lte: query.to ? new Date(query.to) : undefined,
            }
          : undefined,
    };

    const [data, total] = await Promise.all([
      this.prisma.clientOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ deliveryDueAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          client: {
            select: {
              id: true,
              code: true,
              name: true,
              phone: true,
            },
          },
          sales: {
            select: {
              id: true,
              code: true,
              status: true,
              soldAt: true,
            },
          },
        },
      }),
      this.prisma.clientOrder.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total },
    };
  }

  async create(dto: CreateClientOrderDto) {
    await this.ensureClientExists(dto.clientId);

    const data = await this.prisma.clientOrder.create({
      data: {
        code: this.generateCode('CLO'),
        clientId: dto.clientId,
        orderedAt: dto.orderedAt ? new Date(dto.orderedAt) : undefined,
        deliveryDueAt: new Date(dto.deliveryDueAt),
        priority: (dto.priority as ClientOrderPriority | undefined) ?? ClientOrderPriority.NORMAL,
        note: dto.note,
      },
      include: {
        client: {
          select: {
            id: true,
            code: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return { data };
  }

  async findOne(id: string) {
    const order = await this.prisma.clientOrder.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            code: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        sales: {
          select: {
            id: true,
            code: true,
            status: true,
            soldAt: true,
            total: true,
          },
          orderBy: { soldAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Client order not found');
    }

    return { data: order };
  }

  async updateDeliveryStatus(id: string, dto: UpdateClientOrderDeliveryStatusDto) {
    await this.findOne(id);

    const status = dto.deliveryStatus as ClientOrderDeliveryStatus;
    const data = await this.prisma.clientOrder.update({
      where: { id },
      data: {
        deliveryStatus: status,
        deliveredAt: status === ClientOrderDeliveryStatus.DELIVERED ? new Date() : null,
      },
      include: {
        client: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return { data };
  }

  async updatePriority(id: string, dto: UpdateClientOrderPriorityDto) {
    await this.findOne(id);

    const data = await this.prisma.clientOrder.update({
      where: { id },
      data: {
        priority: dto.priority as ClientOrderPriority,
      },
      include: {
        client: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return { data };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.clientOrder.delete({ where: { id } });
    return { data: { id } };
  }

  async stats(query: ClientOrdersStatsQueryDto) {
    const baseWhere: Prisma.ClientOrderWhereInput = {
      clientId: query.clientId,
    };

    const [toDeliver, delivered, highPriority] = await Promise.all([
      this.prisma.clientOrder.count({
        where: {
          ...baseWhere,
          deliveryStatus: ClientOrderDeliveryStatus.TO_DELIVER,
        },
      }),
      this.prisma.clientOrder.count({
        where: {
          ...baseWhere,
          deliveryStatus: ClientOrderDeliveryStatus.DELIVERED,
        },
      }),
      this.prisma.clientOrder.count({
        where: {
          ...baseWhere,
          deliveryStatus: ClientOrderDeliveryStatus.TO_DELIVER,
          priority: ClientOrderPriority.HIGH,
        },
      }),
    ]);

    return {
      data: {
        toDeliver,
        delivered,
        highPriority,
      },
    };
  }

  private async ensureClientExists(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }

  private generateCode(prefix: string) {
    const now = new Date();
    const stamp = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now
      .getHours()
      .toString()
      .padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now
      .getSeconds()
      .toString()
      .padStart(2, '0')}`;
    const rand = Math.floor(Math.random() * 900 + 100);
    return `${prefix}-${stamp}-${rand}`;
  }
}
