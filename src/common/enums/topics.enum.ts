export enum KafkaTopics {
  CUSTOMER_CREATED = 'customer-created',
  ESCORT_CREATED = 'escort-created',
  USER_CREATED = 'user-created',
  USER_ACTIVE_ACCOUNT = 'user-active-account',
  SEND_EMAIL = 'send-email',
  PAYMENT_METHOD_CHANGES = 'escort-book-payment-method-changes',
}

export const KAFKA_BROKERS = process.env.BROKERS;
