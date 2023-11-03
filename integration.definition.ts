import { IntegrationDefinition } from '@botpress/sdk'
import { name } from './package.json'
import z, { optional } from 'zod'; // This imports zod, a library used for building schemas.

export default new IntegrationDefinition({
  name: name,
  version: '0.2.0',
  // This is where we define the configuration schema for our integration.
  configuration: {
    schema: z.object({
      botToken: z.string(),
      userToken: z.string(), //create a dedicated user; the token is used to lookup contact data in realtime
      apiBaseUrl: z.string(),
      ticketInboxId: z.number(), //for creating tickets (sending summaries), if the bot cannot answer user's question
    })
  },
  actions: {
    humanHandoff: {
      input: {
        schema: z.object({
          conversationId: z.string()
        })
      },
      output: {
        schema: z.object({ succeeded: z.boolean() }) 
      }
    },
    newConversationTicket: {
      input: {
        schema: z.object({
          conversationId: z.string(),
          userId: z.string(),
          summary: z.string(),
        })
      },
      output: {
        schema: z.object({ succeeded: z.boolean() }) 
      }
    }
  },
  channels: {
    chatwootWebsite: {
      messages: {
        text: {
          schema: z.object({ text: z.string() })
        },
        image: {
          schema: z.object({ imageUrl: z.string() })
        },
        video: {
          schema: z.object({ videoUrl: z.string() })
        },
        file: {
          schema: z.object({
            fileUrl: z.string()
          })
        },
        card: {
          schema: z.object({
            imageUrl: z.string(),
            title: z.string(),
            subtitle: z.string(),
          })
        },
        choice: {
          schema: z.object({
            text: z.string(),
            options: z.array(z.object({ label: z.string(), value: z.string() }))
          })
        },
      },
      message: {
        tags: {
          messageId: {
            title: "messageId",
            description: "messageId from Chatwoot"
          },
          senderType: {
            title: "senderType",
            description: "senderType from Chatwoot"
          }
        }
      },
      conversation: {
        tags: {
          conversationId: {
            title: "Conversation ID",
            description: "Conversation ID from Chatwoot",
          },
          accountId: {
            title: "accountId",
            description: "accountId from Chatwoot"
          }
        }
      }
    },

  },

  user: {
    tags: {
      senderId: {
        title: "Sender ID",
        description: "Sender ID from Chatwoot",
      }
    }
  }
})
