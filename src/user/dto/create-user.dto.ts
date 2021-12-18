import { Role } from '../enums/roles.enum';

export class CreateUserDto {
  email: string;
  password: string;
  roles?: Role[];
}