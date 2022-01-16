import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class VaultService {

  @Inject(HttpService)
  private readonly httpService: HttpService;

  async getSecretAsync(rowKey: string): Promise<string> {
    const response = await this.httpService.get('/secrets/row-key', {
      params: { rowKey },
    }).toPromise();

    return response?.data?.data?.secretValue;
  }

}
