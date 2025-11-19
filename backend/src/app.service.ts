import { Injectable } from '@nestjs/common';
import { BaseService } from './common/logger/base.service';

@Injectable()
export class AppService extends BaseService {
  constructor() {
    super(AppService.name);
  }

  getHello(): string {
    return 'Hello World!';
  }
}
