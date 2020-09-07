# Botium Connector for Einstein Bots

[![NPM](https://nodei.co/npm/botium-connector-einsteinbot.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/botium-connector-einsteinbot/)

[![Codeship Status for codeforequity-at/botium-connector-einsteinbot](https://app.codeship.com/projects/9ba53c50-d343-0138-9788-0add58eace64/status?branch=master)](https://app.codeship.com/projects/408315)
[![npm version](https://badge.fury.io/js/botium-connector-einsteinbot.svg)](https://badge.fury.io/js/botium-connector-einsteinbot)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

This is a [Botium](https://github.com/codeforequity-at/botium-core) connector for testing your Salesforce Einstein chatbot.

__Did you read the [Botium in a Nutshell](https://medium.com/@floriantreml/botium-in-a-nutshell-part-1-overview-f8d0ceaf8fb4) articles? Be warned, without prior knowledge of Botium you won't be able to properly use this library!__

## How it works
Botium connects to your Einstein chatbot using the [Salesforce Live Agent REST API](https://developer.salesforce.com/docs/atlas.en-us.live_agent_rest.meta/live_agent_rest/live_agent_rest_understanding_resources.htm). 

It can be used as any other Botium connector with all Botium Stack components:
* [Botium CLI](https://github.com/codeforequity-at/botium-cli/)
* [Botium Bindings](https://github.com/codeforequity-at/botium-bindings/)
* [Botium Box](https://www.botium.at)

## Requirements
* **Node.js and NPM**
* a **Einstein bot**
* a **project directory** on your workstation to hold test cases and Botium configuration

## Install Botium and Einstein Connector

When using __Botium CLI__:

```
> npm install -g botium-cli
> npm install -g botium-connector-einsteinbot
> botium-cli init
> botium-cli run
```

When using __Botium Bindings__:

```
> npm install -g botium-bindings
> npm install -g botium-connector-einsteinbot
> botium-bindings init mocha
> npm install && npm run mocha
```

When using __Botium Box__:

_Already integrated into Botium Box, no setup required_

## Connecting Einstein chatbot to Botium

You have to collect some information from your Salesforce instance - see capabilities description below.

Create a botium.json in your project directory, filling in the required information:

```
{
  "botium": {
    "Capabilities": {
      "PROJECTNAME": "<whatever>",
      "CONTAINERMODE": "einsteinbot",
      "EINSTEINBOT_ENDPOINT": "xxx",
      "EINSTEINBOT_ORGANIZATION_ID": "xxx",
      "EINSTEINBOT_DEPLOYMENT_ID": "xxx",
      "EINSTEINBOT_CHATBUTTON_ID": "xxx"
    }
  }
}
```

To check the configuration, run the emulator (Botium CLI required) to bring up a chat interface in your terminal window:

```
> botium-cli emulator
```

Botium setup is ready, you can begin to write your [BotiumScript](https://github.com/codeforequity-at/botium-core/wiki/Botium-Scripting) files.

## Supported Capabilities

Set the capability __CONTAINERMODE__ to __einsteinbot__ to activate this connector.

### EINSTEINBOT_ENDPOINT
Chat API Endpoint

Find it in Salesforce: Service-Setup | Channels | Chat | Chat-Settings

### EINSTEINBOT_ORGANIZATION_ID
Organization Id

Find it in Salesforce: Setup | Company Settings | Company information

### EINSTEINBOT_DEPLOYMENT_ID
Deployment Id

Find it in Salesforce: Service-Setup | Channels | Chat | Deployments, click on deployment and get it from the page url (address=%2F<xxxxxx>)

### EINSTEINBOT_CHATBUTTON_ID
Chatbot Button Id

Find it in Salesforce: Service-Setup | Channels | Chat | Chat Buttons, click on button and get it from the page url (address=%2F<xxxxxx>)

### EINSTEINBOT_VISITORNAME
Visitor name (optional)

Visitor name to be used for the Botium conversations 
