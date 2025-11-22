import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../../database/entities/school.entity';

// Extend Express Request to include 'school'
declare global {
  namespace Express {
    interface Request {
      school?: School;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (tenantId) {
      const school = await this.schoolRepository.findOne({ where: { id: tenantId } });
      if (!school) {
        throw new NotFoundException('Invalid Tenant ID');
      }
      req.school = school;
    }

    next();
  }
}