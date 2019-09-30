const Alexa = require('ask-sdk');
const client = require('cheerio-httpcli');
const npmRequest = require('request');
const qiitaUrl = 'https://qiita.com/';
const slackUrl = "https://hooks.slack.com/services/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";

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
    // スクレイピング
    client.fetch(qiitaUrl)
      .then(function (result) {
        const $ = result.$;
        const data = $('.allWrapper .p-home_main div').attr('data-hyperapp-props');
        const trend = JSON.parse(data).trend.edges;
        trend.map(trend => {
          let title = trend.node.title;
          let author = trend.node.author.urlName;
          let uuid = trend.node.uuid;
          let qiitaLink = `https://qiita.com/${author}/items/${uuid}`;
          qiitaDocuments.push({
            title,
            qiitaLink
          });
        });
      })
      .catch(function (error) {
        console.log(error);
      });
    // メッセージ定義
    const speechOutput =
      '本日のおすすめ記事10件です。' +
      qiitaDocuments[0].title + '、' +
      qiitaDocuments[1].title + '、' +
      qiitaDocuments[2].title + '、' +
      qiitaDocuments[3].title + '、' +
      qiitaDocuments[4].title + '、' +
      qiitaDocuments[5].title + '、' +
      qiitaDocuments[6].title + '、' +
      qiitaDocuments[7].title + '、' +
      qiitaDocuments[8].title + '、' +
      qiitaDocuments[9].title +
      'です。';
    // Slack送信
    qiitaDocuments.map(q => {
      message = `${q.title} \n ${q.qiitaLink}`
      npmRequest.post({
        url: slackUrl,
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          "text": message,
        },
      }, function (error, res, body) {
        if (!error && res.statusCode === 200) {
          console.log(body);
        } else {
          console.log('error');
        }
      });
    })
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