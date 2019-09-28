const Alexa = require('ask-sdk');
const client = require('cheerio-httpcli');
const url = 'https://qiita.com/';

// constants
const SKILL_NAME = 'おすすめ技術記事';
const INITIAL_MESSAGE = `${SKILL_NAME}へようこそ`;
const HELP_MESSAGE = 'キータから最新のトレンドを取得することができます';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'バイバイ〜！';
const qiitaDocuments = [];

const initialHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechOutput = INITIAL_MESSAGE;
    client.fetch(url)
      .then(function (result) {
        const $ = result.$;
        const data = $('.allWrapper .p-home_main div').attr('data-hyperapp-props');
        const trend = JSON.parse(data).trend.edges;
        trend.map(trend => {
          let title = trend.node.title;
          qiitaDocuments.push(title);
        })
        console.log(qiitaDocuments);
      })
      .catch(function (error) {
        console.log(error);
      });

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  },
};

const getQiitaDocumentTitleHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'GetDocumentsIntent';
  },
  handle(handlerInput) {
    const speechOutput =
      '本日のおすすめ記事10件です。' +
      qiitaDocuments[0] + '、' +
      qiitaDocuments[1] + '、' +
      qiitaDocuments[2] + '、' +
      qiitaDocuments[3] + '、' +
      qiitaDocuments[4] + '、' +
      qiitaDocuments[5] + '、' +
      qiitaDocuments[6] + '、' +
      qiitaDocuments[7] + '、' +
      qiitaDocuments[8] + '、' +
      qiitaDocuments[9] +
      'です。';
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.CancelIntent' ||
        request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, an error occurred.')
      .reprompt('Sorry, an error occurred.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    initialHandler,
    getQiitaDocumentTitleHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();