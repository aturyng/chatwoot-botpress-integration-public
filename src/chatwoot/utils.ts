
export function getTag(tag: string) {
  return `${Consts.tags.prefix}:${tag}`;
}

export const Consts = {
  senderType: {
    agentBot: "agent_bot",
    notAgentBot: "not_agent_bot",
  },
  tags: {
    prefix: "chatwootintegration",
    user: {
      senderId: "senderId"
    },
    conversation: {
      conversationId: "conversationId",
      accountId: "accountId"
    },
    message: {
      messageId: "messageId",
      senderType: "senderType"
    }
  }
};
