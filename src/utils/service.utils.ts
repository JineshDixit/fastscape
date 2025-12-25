import { Model, ModelStatic, WhereOptions, FindOptions, Transaction } from 'sequelize';
import { createError } from '../services/middleware/errorHandler';
import { validateUUID } from './validation.utils';
import { parsePaginationParams } from './response.utils';

/**
 * Base service class with common CRUD operations
 */
export abstract class BaseService<T extends Model> {
  protected model: ModelStatic<T>;

  constructor(model: ModelStatic<T>) {
    this.model = model;
  }

  /**
   * Find by primary key with validation
   */
  protected async findByIdOrThrow(
    id: string, 
    options?: FindOptions<T['_attributes']>,
    errorMessage: string = 'Record not found'
  ): Promise<T> {
    validateUUID(id);
    
    const record = await this.model.findByPk(id, options);
    
    if (!record) {
      throw createError(errorMessage, 404);
    }
    
    return record;
  }

  /**
   * Find one with validation
   */
  protected async findOneOrThrow(
    where: WhereOptions<T['_attributes']>,
    options?: FindOptions<T['_attributes']>,
    errorMessage: string = 'Record not found'
  ): Promise<T> {
    const record = await this.model.findOne({ where, ...options });
    
    if (!record) {
      throw createError(errorMessage, 404);
    }
    
    return record;
  }

  /**
   * Check if record exists
   */
  protected async exists(where: WhereOptions<T['_attributes']>): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }

  /**
   * Create with validation
   */
  protected async createRecord(
    data: T['_creationAttributes'],
    options?: { transaction?: Transaction }
  ): Promise<T> {
    return this.model.create(data, options);
  }

  /**
   * Update with validation
   */
  protected async updateRecord(
    record: T,
    data: Partial<T['_attributes']>,
    options?: { transaction?: Transaction }
  ): Promise<T> {
    await record.update(data, options);
    return record;
  }

  /**
   * Delete with validation
   */
  protected async deleteRecord(
    record: T,
    options?: { transaction?: Transaction }
  ): Promise<void> {
    await record.destroy(options);
  }

  /**
   * Find with pagination
   */
  protected async findWithPagination(
    where: WhereOptions<T['_attributes']>,
    query: any,
    options?: Omit<FindOptions<T['_attributes']>, 'where' | 'limit' | 'offset'>
  ): Promise<{ items: T[]; total: number; pagination: any }> {
    const { page, limit, offset } = parsePaginationParams(query);
    
    const { count, rows } = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      ...options
    });

    return {
      items: rows,
      total: count,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Bulk operations
   */
  protected async bulkCreate(
    records: T['_creationAttributes'][],
    options?: { transaction?: Transaction }
  ): Promise<T[]> {
    return this.model.bulkCreate(records, options);
  }

  protected async bulkUpdate(
    values: Partial<T['_attributes']>,
    where: WhereOptions<T['_attributes']>,
    options?: { transaction?: Transaction }
  ): Promise<[number]> {
    return this.model.update(values, { where, ...options });
  }

  protected async bulkDelete(
    where: WhereOptions<T['_attributes']>,
    options?: { transaction?: Transaction }
  ): Promise<number> {
    return this.model.destroy({ where, ...options });
  }
}

/**
 * User-scoped service base class
 */
export abstract class UserScopedService<T extends Model> extends BaseService<T> {
  /**
   * Find by ID with user scope validation
   */
  protected async findByIdWithUserScope(
    id: string,
    userId: string,
    userField: string = 'userId',
    options?: FindOptions<T['_attributes']>,
    errorMessage: string = 'Record not found or access denied'
  ): Promise<T> {
    validateUUID(id);
    validateUUID(userId, 'User ID');
    
    const whereCondition: any = {
      id,
      [userField]: userId
    };
    
    const record = await this.model.findOne({
      where: whereCondition,
      ...options
    });
    
    if (!record) {
      throw createError(errorMessage, 404);
    }
    
    return record;
  }

  /**
   * Find all with user scope
   */
  protected async findAllWithUserScope(
    userId: string,
    userField: string = 'userId',
    options?: FindOptions<T['_attributes']>
  ): Promise<T[]> {
    validateUUID(userId, 'User ID');
    
    const whereCondition: any = {
      [userField]: userId
    };
    
    return this.model.findAll({
      where: whereCondition,
      ...options
    });
  }

  /**
   * Update with user scope validation
   */
  protected async updateWithUserScope(
    id: string,
    userId: string,
    data: Partial<T['_attributes']>,
    userField: string = 'userId',
    options?: { transaction?: Transaction }
  ): Promise<T> {
    const record = await this.findByIdWithUserScope(id, userId, userField);
    return this.updateRecord(record, data, options);
  }

  /**
   * Delete with user scope validation
   */
  protected async deleteWithUserScope(
    id: string,
    userId: string,
    userField: string = 'userId',
    options?: { transaction?: Transaction }
  ): Promise<void> {
    const record = await this.findByIdWithUserScope(id, userId, userField);
    await this.deleteRecord(record, options);
  }
}

/**
 * Common service patterns
 */
export const createStandardService = <T extends Model>(
  model: ModelStatic<T>,
  options: {
    userScoped?: boolean;
    userField?: string;
    defaultIncludes?: any[];
    defaultOrder?: any[];
  } = {}
) => {
  if (options.userScoped) {
    return new (class extends UserScopedService<T> {
      constructor() {
        super(model);
      }

      async getById(id: string, userId?: string) {
        if (userId) {
          return this.findByIdWithUserScope(id, userId, options.userField, {
            include: options.defaultIncludes,
          });
        }
        return this.findByIdOrThrow(id, {
          include: options.defaultIncludes,
        });
      }

      async getList(filters: any, userId?: string) {
        const findOptions: FindOptions<T['_attributes']> = {
          include: options.defaultIncludes,
          order: options.defaultOrder || [['createdAt', 'DESC']],
        };

        if (userId) {
          return this.findAllWithUserScope(userId, options.userField, findOptions);
        }
        
        return this.model.findAll(findOptions);
      }

      async create(data: T['_creationAttributes'], userId?: string) {
        if (userId) {
          (data as any)[options.userField || 'userId'] = userId;
        }
        return this.createRecord(data);
      }

      async update(id: string, data: Partial<T['_attributes']>, userId?: string) {
        if (userId) {
          return this.updateWithUserScope(id, userId, data, options.userField);
        }
        const record = await this.findByIdOrThrow(id);
        return this.updateRecord(record, data);
      }

      async delete(id: string, userId?: string) {
        if (userId) {
          return this.deleteWithUserScope(id, userId, options.userField);
        }
        const record = await this.findByIdOrThrow(id);
        await this.deleteRecord(record);
      }
    })();
  } else {
    return new (class extends BaseService<T> {
      constructor() {
        super(model);
      }

      async getById(id: string) {
        return this.findByIdOrThrow(id, {
          include: options.defaultIncludes,
        });
      }

      async getList(filters: any) {
        const findOptions: FindOptions<T['_attributes']> = {
          include: options.defaultIncludes,
          order: options.defaultOrder || [['createdAt', 'DESC']],
        };
        
        return this.model.findAll(findOptions);
      }

      async create(data: T['_creationAttributes']) {
        return this.createRecord(data);
      }

      async update(id: string, data: Partial<T['_attributes']>) {
        const record = await this.findByIdOrThrow(id);
        return this.updateRecord(record, data);
      }

      async delete(id: string) {
        const record = await this.findByIdOrThrow(id);
        await this.deleteRecord(record);
      }
    })();
  }
};