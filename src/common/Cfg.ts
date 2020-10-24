import { Uri } from './Uri'


const blobUri = new Uri('https://pyt.blob.core.windows.net/data')
const blobCdnUri = new Uri('https://pyt-data.azureedge.net/data')
export const blobCfg = {
  resultsUri: blobUri.addPath('results'),
  indexUri: blobUri.addPath('results/index'),
  indexCdnUri: blobCdnUri.addPath('results/index'),
}

export const webCfg = {
  //uri: new Uri('http://localhost:7071'),
  uri: new Uri('https://recfluence.azurewebsites.net'),
  cache: true
}
