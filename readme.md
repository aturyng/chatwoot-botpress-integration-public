# Prerequisites

To follow this guide and build your own integration, ensure you have the following:

- A Botpress account
- Ensure pnpm is installed and is on version 8. Check with pnpm --version.

Note: refer to official documentation: https://botpress.com/docs/developers/howTo/build-integration/

# Build

If inside a devcontainer, install the botpress cli.

```bash
pnpm setup && source /home/node/.bashrc && pnpm install -g @botpress/cli
```

Run the following commands

```bash
pnpm install
pnpm dlx @botpress/cli build
```

# Deploy

 Use this to login to your botpress account. You will need to generate a personal access token from your botpress account. Go to Admin Dashboard → Profile → Personal Access Token. Generate a new one and paste it in the CLI.

```bash
pnpm dlx @botpress/cli login
```

Use this to deploy the integration.

```bash
pnpm run deploy
```

# Initial setup

1. Open private integrations in bottpress cloud (https://app.botpress.cloud/)
2. Install "chatwootintegration" integration
3. In the settings screen configure the the variables, as described below, toggle "Enable Itegration" and clieck "Save configuration"

Variables:
- API Base URL
    - Set this to "https://BASE_URL", where BASE_URL is the DNS name to the server where you Chatwoot is hosted
- Bot Token
    - Create a new bot in Chatwoot (https://BASE_URL/super_admin/agent_bots). Set "outgoing URL" to the value of "Webhook URL" provided by Botpress.
    - Copy the bot's token (https://BASE_URL/super_admin/access_tokens) and paste as "Bot Token" in Botpress.
- User Token
    - Create a dedicated user in Chatwoot (https://BASE_URL/super_admin/users)
    - Copy the user's token (https://BASE_URL/super_admin/access_tokens) and paste as "User Token" in Botpress.
- Ticket Inbox ID
    - Open the Inbox you would like to connect in Chatwoot, lookup the URL in browser and take the last number from the URL. Example URL "https://BASE_URL/app/accounts/1/inbox/11", so the inbox ID is "11". Paste this number in the field.
    - Personal note: an Email inbox is perfect for such a use case. However, the email continuity must be configure.

# Botpress Studio

Keep in mind, in Botpress Studio, when using the custom action "New Conversation Ticket", set the fields as following:

- Conversation Id
    - Set to "{{event.conversationId}}"
- User Id
    - Set to "{{event.userId}}"

When using the custom action "Human Handoff", set the fields as following:

- Conversation Id
    - Set to "{{event.conversationId}}"
