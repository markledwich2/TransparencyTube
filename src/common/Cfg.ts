import { tryCatch } from './Try'
import { Uri } from './Uri'

//const env: NodeJS.ProcessEnv = typeof process == 'undefined' ? {} : process.env
const branchEnv = tryCatch(() => process.env.GATSBY_BRANCH_ENV)
const branchSuffix = branchEnv ? `-dev-${branchEnv}` : ''
console.log('env info', { branchEnv, branchSuffix })
const blobUri = new Uri(`https://ytapp.blob.core.windows.net/public${branchSuffix}`)
const blobCdnUri = branchSuffix ? blobUri : new Uri('https://ttube.azureedge.net/public')
export const blobCfg = {
  resultsUri: blobUri.addPath('results'),
  indexUri: blobUri.addPath('results/index'),
  indexCdnUri: blobCdnUri.addPath('results/index'),
  indexVersion: 'v2'
}

export const webCfg = {
  //uri: new Uri('http://localhost:7071'),
  uri: new Uri('https://recfluence.azurewebsites.net'),
  cache: true
}