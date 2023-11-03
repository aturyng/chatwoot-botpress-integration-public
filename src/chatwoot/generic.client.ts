import * as botpress from ".botpress";

import { Conversation } from '@botpress/client';
import { IntegrationContext } from '@botpress/sdk';
import { Merge } from '@botpress/sdk/dist/type-utils';
import ChatwootClient from '@figuro/chatwoot-sdk';
import { getTag, Consts } from './utils';


export function getChatwootClient(ctx: IntegrationContext) {
  return new ChatwootClient({
    config: {
      basePath: ctx.configuration.apiBaseUrl,
      with_credentials: true,
      credentials: "include",
      token: ctx.configuration.botToken
    }
  });
}

export function getChatwootClientUsingUsersToken(ctx: IntegrationContext) {
  return new ChatwootClient({
    config: {
      basePath: ctx.configuration.apiBaseUrl,
      with_credentials: true,
      credentials: "include",
      token: ctx.configuration.userToken
    }
  });
}

export async function doSendMessageToChatwoot(ctx: IntegrationContext<botpress.configuration.Configuration>, conversation: Merge<Conversation, { tags: Partial<Record<"chatwootintegration:conversationId" | "chatwootintegration:accountId", string>>; }>, ack: (props: { tags: Partial<Record<"chatwootintegration:messageId" | "chatwootintegration:senderType", string>>; }) => Promise<void>, logger: { forBot: () => { info: (message?: any, ...optionalParams: any[]) => void; warn: (message?: any, ...optionalParams: any[]) => void; error: (message?: any, ...optionalParams: any[]) => void; debug: (message?: any, ...optionalParams: any[]) => void; }; }, payload: { content: any; }) {
  logger.forBot().debug(`Sending message back to Chatwoot`);
  const chatwootClient = getChatwootClient(ctx);

  const chatwootMessage = await chatwootClient.messages.create({
    accountId: parseInt(conversation.tags['chatwootintegration:accountId']!),
    conversationId: parseInt(conversation.tags['chatwootintegration:conversationId']!),
    data: payload
  });

  await ack({
    tags: {
      [getTag(Consts.tags.message.messageId)]: chatwootMessage.id!.toString(),
      [getTag(Consts.tags.message.senderType)]: Consts.senderType.agentBot
    }
  });
}
export async function toggleConversationStatus(ctx: IntegrationContext<botpress.configuration.Configuration>, cwAccountID: number, cwConversationID: number, statusToSet: "open" | "resolved" | "pending") {
  const chatwootClient = getChatwootClient(ctx);
  const result = await chatwootClient.conversations.toggleStatus({
    accountId: cwAccountID,
    conversationId: cwConversationID,
    data: {
      status: statusToSet
    }
  });
  return result.payload;
}
