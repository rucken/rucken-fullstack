import { WebhookEvent } from '@nestjs-mod/webhook';
import { getText } from 'nestjs-translates';
import { EngineUserDto } from '../generated/rest/dto/engine-user.dto';

export enum EngineWebhookEvent {
  'engine.sign-up' = 'engine.sign-up',
  'engine.sign-in' = 'engine.sign-in',
  'engine.complete-sign-up' = 'engine.complete-sign-up',
  'engine.sign-out' = 'engine.sign-out',
  'engine.forgot-password' = 'engine.forgot-password',
  'engine.complete-forgot-password' = 'engine.complete-forgot-password',
  'engine.update-profile' = 'engine.update-profile',
}

const example = {
  id: '77af2745-d972-4e1f-994a-fae8ad71d7ab',
  appData: { custom: 'data' },
  birthdate: new Date(),
  createdAt: new Date(),
  email: 'user@example.com',
  emailVerifiedAt: new Date(),
  firstname: 'Firstname',
  gender: 'm',
  lastname: 'Lastname',
  phone: '+888888888',
  phoneVerifiedAt: new Date(),
  picture: 'http://example.com/image/77af2745-d972-4e1f-994a-fae8ad71d7ab.jpg',
  revokedAt: new Date(),
  roles: 'user',
  updatedAt: new Date(),
  username: 'nickname',
  lang: 'en',
  timezone: 0,
} as EngineUserDto;

export const ENGINE_WEBHOOK_EVENTS: WebhookEvent[] = [
  {
    eventName: EngineWebhookEvent['engine.sign-up'],
    description: getText('An event that is triggered after a new user registers'),
    example,
  },
  {
    eventName: EngineWebhookEvent['engine.sign-in'],
    description: getText('An event that is triggered after a user login'),
    example,
  },
  {
    eventName: EngineWebhookEvent['engine.complete-sign-up'],
    description: getText('An event that is triggered after complete a new user registers'),
    example,
  },
  {
    eventName: EngineWebhookEvent['engine.sign-out'],
    description: getText('An event that is triggered after a user logout'),
    example,
  },
  {
    eventName: EngineWebhookEvent['engine.forgot-password'],
    description: getText('An event that is triggered after a user call forgot password method'),
    example,
  },
  {
    eventName: EngineWebhookEvent['engine.complete-forgot-password'],
    description: getText('An event that is triggered after a user calls to confirm a forgotten password change'),
    example,
  },
  {
    eventName: EngineWebhookEvent['engine.update-profile'],
    description: getText('An event that fires after user information is updated.'),
    example,
  },
];
