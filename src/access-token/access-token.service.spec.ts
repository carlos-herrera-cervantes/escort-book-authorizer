import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AccessTokenService } from './access-token.service';
import { AccessToken } from './schemas/access-token.schema';

describe('AccessTokenService', () => {
  let service: AccessTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenService,
        {
          provide: getModelToken(AccessToken.name),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AccessTokenService>(AccessTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
