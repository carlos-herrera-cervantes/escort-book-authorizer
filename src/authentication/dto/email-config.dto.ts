import { User } from '../../user/schemas/user.schema';

export class EmailConfigDto {
  user: User;
  verificationEndpoint: string;
  templateUrl: string;
  subject: string;
}
