import { User } from '../../user/schemas/user.schema';

export class QueueMessageDTO {
  user: User;
  verificationEndpoint: string;
  templateUrl: string;
  subject: string;
}
