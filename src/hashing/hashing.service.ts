import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashingService {

  async compareAsync(plainText: string, cipherText: string): Promise<boolean> {
    return bcrypt.compare(plainText, cipherText);
  }

  async hashAsync(plainText: string, salt: number = 10): Promise<string> {
    return bcrypt.hash(plainText, salt);
  }

}
