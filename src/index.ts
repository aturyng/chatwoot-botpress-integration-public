import * as botpress from '.botpress'
import { doSendInteractiveMessageToChatwoot } from './chatwoot/interactive-messages.client';
import { submitImageToCw, submitCardToCw, submitChoiceOptionsToCw } from './chatwoot/interactive-messages.client';
import { getTag, Consts } from './chatwoot/utils';
import { toggleConversationStatus, doSendMessageToChatwoot, getChatwootClient, getChatwootClientUsingUsersToken } from './chatwoot/generic.client';

console.info('starting integration')


export default new botpress.Integration({
  register: async ({ logger }) => {
    logger.forBot().info('Enabling Chatwoot integration')
  },

  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
  },
  actions: {
    humanHandoff: async ({ ctx, client, input, logger }) => {
      logger.forBot().debug(`Action humanHandoff has been fired.`)

      // Get conversation id from input
      if (!input?.conversationId) { return { succeeded: false } }
      const { conversation } = await client.getConversation({
        id: input.conversationId
      });

      const tagCwAccountId = getTag(Consts.tags.conversation.accountId);
      if (!conversation || !conversation?.tags[tagCwAccountId]) { return { succeeded: false } }
      const cwAccountID = conversation?.tags[tagCwAccountId];

      const tagCwConversationId = getTag(Consts.tags.conversation.conversationId);
      const cwConversationID = conversation?.tags[tagCwConversationId];

      const resultPayload = await toggleConversationStatus(ctx, +cwAccountID!, +cwConversationID!, "open");

      logger.forBot().debug(`Finished action humanHandoff with result: ${resultPayload?.success}.`)
      return { succeeded: resultPayload?.success! }
    },
    newConversationTicket: async ({ ctx, client, input, logger }) => {
      logger.forBot().debug(`Action newConversationTicket has been fired.`)

      // Get conversation id from input
      if (!input?.conversationId) { return { succeeded: false } }
      const { conversation } = await client.getConversation({
        id: input.conversationId
      });

      const tagCwAccountId = getTag(Consts.tags.conversation.accountId);
      if (!conversation || !conversation?.tags[tagCwAccountId]) { return { succeeded: false } }
      const cwAccountID = conversation?.tags[tagCwAccountId];


      // Get user id from input
      if (!input?.userId) { return { succeeded: false } }
      const { user } = await client.getUser({
        id: input.userId
      });

      const cwContactId = user?.tags["chatwootintegration:senderId"];

      const chatwootClientAsUser = getChatwootClientUsingUsersToken(ctx);

      const cwUser = await chatwootClientAsUser.contacts.get({
        accountId: +cwAccountID!,
        id: +cwContactId!}
        ) as any; //cast to any, since the API's implementation is outdated

      const chatwootClient = getChatwootClient(ctx); //the default client uses a botApiKey
      const cwConversation = await chatwootClient.conversations.create({
        accountId: +cwAccountID!,
        data: {
          source_id: cwUser.payload.email,
          inbox_id: ctx.configuration.ticketInboxId.toString(),
          status: "open"
        }
      });

      const cwMessage = await chatwootClient.messages.create({
        accountId: +cwAccountID!,
        conversationId: +cwConversation.id!,
        data: {
          content: input.summary
        }
      });


      const success = (cwMessage.id) ? true : false;
      logger.forBot().debug(`Finished action newConversationTicket with result: ${success}.`)
      return { succeeded: success }
    }
  },

  channels: {
    chatwootWebsite: {
      messages: {
        text: async ({ ctx, conversation, ack, message, logger }) => {

          await doSendMessageToChatwoot(ctx, conversation, ack, logger, {
            content: message.payload.text,
          });

        },
        image: async ({ ctx, conversation, ack, message, logger }) => {

          await doSendInteractiveMessageToChatwoot(ack, logger, submitImageToCw(
            conversation.tags['chatwootintegration:accountId']!,
            conversation.tags['chatwootintegration:conversationId']!,
            ctx,
            message.payload.imageUrl
          ));

        },
        video: async ({ ctx, conversation, ack, message, logger }) => {
          //for now sending only as link
          await doSendMessageToChatwoot(ctx, conversation, ack, logger, {
            content: message.payload.videoUrl,
          });

        },
        file: async ({ ctx, conversation, ack, message, logger }) => {
          //for now sending only as link
          await doSendMessageToChatwoot(ctx, conversation, ack, logger, {
            content: message.payload.fileUrl,
          });

        },
        card: async ({ ctx, conversation, ack, message, logger }) => {

          await doSendInteractiveMessageToChatwoot(ack, logger, submitCardToCw(
            conversation.tags['chatwootintegration:accountId']!,
            conversation.tags['chatwootintegration:conversationId']!,
            ctx,
            message.payload
          ));

        },
        choice: async ({ ctx, conversation, ack, message, logger }) => {

          await doSendInteractiveMessageToChatwoot(ack, logger, submitChoiceOptionsToCw(
            conversation.tags['chatwootintegration:accountId']!,
            conversation.tags['chatwootintegration:conversationId']!,
            ctx,
            message.payload
          ));

        },
      },

    },
  },

  handler: async ({ req, client, logger }) => {

    if (!req.body) return;
    logger.forBot().debug(`Called handler on chatwoot integration.`)

    const payload = JSON.parse(req.body)
    logger.forBot().debug(`Event: ${payload.event}`)
    logger.forBot().debug(`Content: ${payload.content}`)

    const senderType = (payload.sender.type &&
      payload.sender.type === Consts.senderType.agentBot) ? Consts.senderType.agentBot : Consts.senderType.notAgentBot;
    logger.forBot().debug(`Sender.type: ${senderType}`)

    // As according to the Chatwoot documentation only the conversations with status pending 
    // https://www.chatwoot.com/docs/product/others/agent-bots
    const messageCreatedNotByBot =
      payload.event === "message_created" &&
      senderType === Consts.senderType.notAgentBot &&
      payload.conversation.status === "pending"

    // according to messageSingleChoiceUpdatedByBot it is send by bot, as this is how the Chatwoot's API handles it
    // in reality the human
    const messageSingleChoiceUpdatedByBot =
      payload.event === "message_updated" &&
      senderType === Consts.senderType.agentBot &&
      payload.content_type === "input_select" &&
      payload.conversation.status === "pending"


    if (messageCreatedNotByBot || messageSingleChoiceUpdatedByBot) {

      var messageToSend = ""
      if (messageCreatedNotByBot) {
        messageToSend = payload.content
      } else if (messageSingleChoiceUpdatedByBot) {
        messageToSend = payload.content_attributes.submitted_values[0].value
      }

      const senderId = payload.conversation.contact_inbox.contact_id
      const conversationId = payload.conversation.id
      const accountId = payload.account.id

      const { user } = await client.getOrCreateUser({ tags: { [getTag(Consts.tags.user.senderId)]: senderId.toString() } });

      const { conversation } = await client.getOrCreateConversation({
        channel: "chatwootWebsite",
        tags: {
          [getTag(Consts.tags.conversation.conversationId)]: conversationId.toString(),
          [getTag(Consts.tags.conversation.accountId)]: accountId.toString()
        }
      });

      const { message } = await client.getOrCreateMessage({
        conversationId: conversation.id,
        userId: user.id,
        type: "text",
        payload: { text: messageToSend },
        tags: {
          [getTag(Consts.tags.message.messageId)]: payload.id!.toString(),
          [getTag(Consts.tags.message.senderType)]: Consts.senderType.notAgentBot
        }
      })

      logger.forBot().debug(`Submitted message to botpress: ${message}`)

    }
  },
})