export const environment = {
  production: true,

  // Backend real URL
  serverBaseUrl: 'http://3.135.127.195:5001/api/v1',
  //Production URL
  //serverBaseUrl: 'https://analyses-engagement-berkeley-orange.trycloudflare.com/api/v1'

  authEndpointPath: '/authentication',
  userEndpointPath: '/users',
  businessmanEndpointPath: '/businessmen',
  supplierEndpointPath: '/suppliers',
  profileEndpointPath: '/profiles',
  businessSupplierRequests: '/business-supplier-requests',
  observationEndpointPath: '/observations',
  // Endpoints para imágenes de perfil - SIN placeholder
  profileImagesEndpointPath: '/profiles',

  // Resto igual...
  batchesEndpointPath: '/batches',
  supplierReviewEndpointPath: '/supplier-reviews',
  configurationEndpointPath: '/configurationssuppl',

  //Payment endpoints
  paymentEndpointPath: '/payments',

  // Stripe configuration
  stripePublishableKey: 'pk_test_51RhjroQZmHfPn08lbpI7xgzkS3eDJngVHcp5MpJwKPhY80d43pnTt1Dt6H79Tki1draTZq1vpvfFbQrnZZDQqIYI00Rbq3vFvj',
  apiVersion: 'v1',
  tokenPrefix: 'Bearer ',
  tokenStorageKey: 'auth_token',
  httpTimeout: 30000,
  httpRetries: 2




};
