const util = require('util')
const fs = require('fs')
const path = require('path')
const request = require('request-promise-native')
const debug = require('debug')('botium-connector-einsteinbot')

const SimpleRestContainer = require('botium-core/src/containers/plugins/SimpleRestContainer.js')
const CoreCapabilities = require('botium-core/src/Capabilities')

const Capabilities = {
  EINSTEINBOT_ENDPOINT: 'EINSTEINBOT_ENDPOINT',
  EINSTEINBOT_ORGANIZATION_ID: 'EINSTEINBOT_ORGANIZATION_ID',
  EINSTEINBOT_DEPLOYMENT_ID: 'EINSTEINBOT_DEPLOYMENT_ID',
  EINSTEINBOT_CHATBUTTON_ID: 'EINSTEINBOT_CHATBUTTON_ID',
  EINSTEINBOT_VISITORNAME: 'EINSTEINBOT_VISITORNAME'
}

const Defaults = {
  [Capabilities.EINSTEINBOT_VISITORNAME]: 'Botium Test'
}

class BotiumConnectorEinsteinBot {
  constructor ({ queueBotSays, caps }) {
    this.queueBotSays = queueBotSays
    this.caps = Object.assign(caps, Defaults, caps)
    this.delegateContainer = null
    this.delegateCaps = null
    this.seqCounter = null
  }

  Validate () {
    debug('Validate called')
    this.caps = Object.assign({}, Defaults, this.caps)

    if (!this.caps[Capabilities.EINSTEINBOT_ENDPOINT]) throw new Error('EINSTEINBOT_ENDPOINT capability required')
    if (!this.caps[Capabilities.EINSTEINBOT_ORGANIZATION_ID]) throw new Error('EINSTEINBOT_ORGANIZATION_ID capability required')
    if (!this.caps[Capabilities.EINSTEINBOT_DEPLOYMENT_ID]) throw new Error('EINSTEINBOT_DEPLOYMENT_ID capability required')
    if (!this.caps[Capabilities.EINSTEINBOT_CHATBUTTON_ID]) throw new Error('EINSTEINBOT_CHATBUTTON_ID capability required')

    const baseUrl = `${this.caps[Capabilities.EINSTEINBOT_ENDPOINT]}${this.caps[Capabilities.EINSTEINBOT_ENDPOINT].endsWith('/') ? '' : '/'}`

    if (!this.delegateContainer) {
      // default values
      this.delegateCaps = {
        [CoreCapabilities.SIMPLEREST_START_HOOK]: async ({ context }) => {
          const sessionIdRequest = {
            uri: `${baseUrl}System/SessionId`,
            method: 'GET',
            headers: {
              'X-LIVEAGENT-API-VERSION': 34,
              'X-LIVEAGENT-AFFINITY': 'null'
            },
            json: true
          }
          debug(`SessionId Request: ${JSON.stringify(sessionIdRequest, null, 2)}`)
          try {
            const sessionIdResponse = await request(sessionIdRequest)
            debug(`Got SessionId Response: ${JSON.stringify(sessionIdResponse, null, 2)}`)
            Object.assign(context, sessionIdResponse)
          } catch (err) {
            throw new Error(`Failed to get Session from Einstein Endpoint: ${err.message}`)
          }
        },
        [CoreCapabilities.SIMPLEREST_PING_URL]: `${baseUrl}Chasitor/ChasitorInit`,
        [CoreCapabilities.SIMPLEREST_PING_VERB]: 'POST',
        [CoreCapabilities.SIMPLEREST_PING_TIMEOUT]: 60000,
        [CoreCapabilities.SIMPLEREST_PING_HEADERS]: {
          'X-LIVEAGENT-API-VERSION': 34,
          'X-LIVEAGENT-AFFINITY': '{{context.affinityToken}}',
          'X-LIVEAGENT-SESSION-KEY': '{{context.key}}',
          'X-LIVEAGENT-SEQUENCE': 1
        },
        [CoreCapabilities.SIMPLEREST_PING_BODY]: {
          organizationId: this.caps[Capabilities.EINSTEINBOT_ORGANIZATION_ID],
          deploymentId: this.caps[Capabilities.EINSTEINBOT_DEPLOYMENT_ID],
          buttonId: this.caps[Capabilities.EINSTEINBOT_CHATBUTTON_ID],
          sessionId: '{{context.id}}',
          userAgent: 'Botium',
          language: 'en-US',
          screenResolution: '1900x1080',
          visitorName: this.caps[Capabilities.EINSTEINBOT_VISITORNAME],
          prechatDetails: [],
          prechatEntities: [],
          receiveQueueUpdates: true,
          isPost: true
        },
        [CoreCapabilities.SIMPLEREST_PING_BODY_RAW]: true,
        [CoreCapabilities.SIMPLEREST_PING_UPDATE_CONTEXT]: false,
        [CoreCapabilities.SIMPLEREST_URL]: `${baseUrl}Chasitor/ChatMessage`,
        [CoreCapabilities.SIMPLEREST_VERB]: 'POST',
        [CoreCapabilities.SIMPLEREST_HEADERS_TEMPLATE]: {
          'X-LIVEAGENT-API-VERSION': 34,
          'X-LIVEAGENT-AFFINITY': '{{context.affinityToken}}',
          'X-LIVEAGENT-SESSION-KEY': '{{context.key}}'
        },
        [CoreCapabilities.SIMPLEREST_BODY_TEMPLATE]: {
          text: '{{msg.messageText}}'
        },
        [CoreCapabilities.SIMPLEREST_REQUEST_HOOK]: ({ requestOptions }) => {
          requestOptions.headers['X-LIVEAGENT-SEQUENCE'] = this.seqCounter
        },
        [CoreCapabilities.SIMPLEREST_POLL_URL]: `${baseUrl}System/Messages`,
        [CoreCapabilities.SIMPLEREST_POLL_VERB]: 'GET',
        [CoreCapabilities.SIMPLEREST_POLL_HEADERS]: {
          'X-LIVEAGENT-API-VERSION': 34,
          'X-LIVEAGENT-AFFINITY': '{{context.affinityToken}}',
          'X-LIVEAGENT-SESSION-KEY': '{{context.key}}'
        },
        [CoreCapabilities.SIMPLEREST_POLL_TIMEOUT]: 60000,
        [CoreCapabilities.SIMPLEREST_POLL_UPDATE_CONTEXT]: false,
        [CoreCapabilities.SIMPLEREST_BODY_JSONPATH]: '$.messages[?(@.type==\'ChatMessage\' || @.type==\'RichMessage\')].message',
        [CoreCapabilities.SIMPLEREST_CONTEXT_MERGE_OR_REPLACE]: 'MERGE'
      }
      this.delegateCaps[CoreCapabilities.SIMPLEREST_RESPONSE_HOOK] = ({ botMsg, botMsgRoot }) => {
        botMsg.messageText = botMsgRoot.text
        if (botMsgRoot.items) {
          botMsg.buttons = botMsgRoot.items.map(i => ({
            text: i.text
          }))
        }
      }

      this.delegateCaps = Object.assign({}, this.caps, this.delegateCaps)

      debug(`Validate delegateCaps ${util.inspect(this.delegateCaps)}`)
      this.delegateContainer = new SimpleRestContainer({ queueBotSays: this.queueBotSays, caps: this.delegateCaps })
    }

    debug('Validate delegate')
    return this.delegateContainer.Validate()
  }

  async Build () {
    await this.delegateContainer.Build()
  }

  async Start () {
    this.seqCounter = 1
    await this.delegateContainer.Start()
  }

  async UserSays (msg) {
    this.seqCounter = this.seqCounter + 1
    await this.delegateContainer.UserSays(msg)
  }

  async Stop () {
    await this.delegateContainer.Stop()
  }

  async Clean () {
    await this.delegateContainer.Clean()
  }
}

module.exports = {
  PluginVersion: 1,
  PluginClass: BotiumConnectorEinsteinBot,
  PluginDesc: {
    name: 'Einstein Bots',
    provider: 'Salesforce',
    avatar: fs.readFileSync(path.join(__dirname, 'logo.png')).toString('base64'),
    capabilities: [
      {
        name: 'EINSTEINBOT_ENDPOINT',
        label: 'Chat API Endpoint',
        description: 'Find it in Salesforce: Service-Setup | Channels | Chat | Chat-Settings',
        type: 'url',
        required: true
      },
      {
        name: 'EINSTEINBOT_ORGANIZATION_ID',
        label: 'Organization Id',
        description: 'Find it in Salesforce: Setup | Company Settings | Company information',
        type: 'string',
        required: true
      },
      {
        name: 'EINSTEINBOT_DEPLOYMENT_ID',
        label: 'Deployment Id',
        description: 'Find it in Salesforce: Service-Setup | Channels | Chat | Deployments, click on deployment and get it from the page url (address=%2F<xxxxxx>)',
        type: 'string',
        required: true
      },
      {
        name: 'EINSTEINBOT_CHATBUTTON_ID',
        label: 'Chatbot Button Id',
        description: 'Find it in Salesforce: Service-Setup | Channels | Chat | Chat Buttons, click on button and get it from the page url (address=%2F<xxxxxx>)',
        type: 'string',
        required: true
      },
      {
        name: 'EINSTEINBOT_VISITORNAME',
        label: 'Visitor name',
        description: `Visitor name to be used for the Botium conversations (default: "${Defaults[Capabilities.EINSTEINBOT_VISITORNAME]}")`,
        type: 'string',
        required: false
      }
    ]
  }
}
