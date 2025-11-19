import { Logger } from '@nestjs/common';

export abstract class BaseService {
  protected readonly logger: Logger;

  protected constructor(context: string) {
    this.logger = new Logger(context);
  }
}
