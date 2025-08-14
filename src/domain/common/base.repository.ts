export class BaseRepository<T extends { id: string }> {
  constructor(private readonly model: any) {}

  async findAll() {
    return await this.model.findMany();
  }

  async findActive() {
    return await this.model.findMany({ where: { isActive: true } });
  }

  async toggleActive(id: string, isActive: boolean) {
    return await this.model.update({ where: { id }, data: { isActive } });
  }
}
