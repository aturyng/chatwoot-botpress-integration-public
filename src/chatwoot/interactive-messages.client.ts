import axios from "axios";
import { IntegrationContext } from '@botpress/sdk';
import { getTag, Consts } from 'src/chatwoot/utils';



export async function doSendInteractiveMessageToChatwoot(ack: (props: { tags: Partial<Record<"chatwootintegration:messageId" | "chatwootintegration:senderType", string>>; }) => Promise<void>, logger: { forBot: () => { info: (message?: any, ...optionalParams: any[]) => void; warn: (message?: any, ...optionalParams: any[]) => void; error: (message?: any, ...optionalParams: any[]) => void; debug: (message?: any, ...optionalParams: any[]) => void; }; }, chatwootApiClient: Promise<import("axios").AxiosResponse<any, any>>) {
  logger.forBot().debug(`Sending interactive message back to Chatwoot`);

  const reply = await chatwootApiClient;
  const chatwootMessage = reply.data;

  logger.forBot().debug(`ChatwootMessage Logs: ${chatwootMessage}`);
  await ack({
    tags: {
      [getTag(Consts.tags.message.messageId)]: chatwootMessage.id!.toString(),
      [getTag(Consts.tags.message.senderType)]: Consts.senderType.agentBot
    }
  });
}export function callMessagesEndpoint(cwAccountId: string, cwConversationId: string, ctx: IntegrationContext, body: any) {
  return axios.post(`${ctx.configuration.apiBaseUrl}/api/v1/accounts/${cwAccountId}/conversations/${cwConversationId}/messages`,
    body,
    {
      headers: getCwClientHeaders(ctx)
    });
}
function getCwClientHeaders(ctx: IntegrationContext) {
  return {
    'Content-Type': 'application/json',
    'api_access_token': ctx.configuration.botToken
  };
}
export async function submitImageToCw(cwAccountId: string, cwConversationId: string, ctx: IntegrationContext, imgUrl: string) {
  return await callMessagesEndpoint(cwAccountId, cwConversationId, ctx, {
    content: "image-as-card",
    content_type: "cards",
    content_attributes: {
      "items": [
        {
          "media_url": imgUrl,
          "actions": [
            {
              "type": "link",
              "text": "🖼️",
              "uri": imgUrl
            }
          ]
        }
      ]
    },
    private: false
  });
}
export async function submitCardToCw(cwAccountId: string, cwConversationId: string, ctx: IntegrationContext, payload: any) {
  return await callMessagesEndpoint(cwAccountId, cwConversationId, ctx, {
    content: "card",
    content_type: "cards",
    content_attributes: {
      "items": [
        {
          "media_url": payload.imageUrl,
          "title": payload.title,
          "description": payload.subtitle,
          "actions": [
            {
              "type": "link",
              "text": "🖼️",
              "uri": payload.imageUrl
            }
          ]
        }
      ]
    },
    private: false
  });

}
export async function submitChoiceOptionsToCw(cwAccountId: string, cwConversationId: string, ctx: IntegrationContext, payload: any) {
  return await callMessagesEndpoint(cwAccountId, cwConversationId, ctx, {
    content: payload.text,
    content_type: "input_select",
    content_attributes: {
      items: payload.options.map((option: { label: string; value: any; }) => {
        return {
          title: option.label,
          value: option.value
        };
      })
    },
    private: false
  });
}

