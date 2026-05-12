import { BadRequestException } from '@nestjs/common';

export class StockInsufficientException extends BadRequestException {
  constructor() {
    super({
      code: 'STOCK_INSUFFICIENT',
      message: 'Stock insuffisant pour cette operation',
      details: [],
    });
  }
}
