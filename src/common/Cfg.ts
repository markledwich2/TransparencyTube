import { Uri } from './Uri'


const blobUri = new Uri('https://pyt.blob.core.windows.net/data')

export const blobCfg = {
  resultsUri: blobUri.addPath('results'),
  indexUri: blobUri.addPath('results/index'),
}

export const webCfg = {
  //uri: new Uri('http://localhost:7071'),
  uri: new Uri('https://recfluence.azurewebsites.net'),
  cache: true
}

export const esCfg = {
  url: 'https://8999c551b92b4fb09a4df602eca47fbc.westus2.azure.elastic-cloud.com:9243',
  creds: 'public:5&54ZPnh!hCg',
  indexes: {
    caption: `caption-2`,
    channel: `channel-2`,
    channelTitle: `channel_title-2`,
    video: `video-2`
  }
}