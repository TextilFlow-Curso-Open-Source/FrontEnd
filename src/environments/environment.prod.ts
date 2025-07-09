export const environment = {
  production: true,
  huggingFaceApiKey: 'PLACEHOLDER_HUGGINGFACE_API_KEY', // ← Será reemplazado por GitHub Actions

  // Production URL
  serverBaseUrl: 'https://analyses-engagement-berkeley-orange.trycloudflare.com/api/v1',

  authEndpointPath: '/authentication',
  userEndpointPath: '/users',
  businessmanEndpointPath: '/businessmen',
  supplierEndpointPath: '/suppliers',
  profileEndpointPath: '/profiles',
  businessSupplierRequests: '/business-supplier-requests',
  observationEndpointPath: '/observations',
  profileImagesEndpointPath: '/profiles',
  batchesEndpointPath: '/batches',
  supplierReviewEndpointPath: '/supplier-reviews',
  configurationEndpointPath: '/configurationssuppl',
  paymentEndpointPath: '/payments',
  stripePublishableKey: 'pk_test_51RhjroQZmHfPn08lbpI7xgzkS3eDJngVHcp5MpJwKPhY80d43pnTt1Dt6H79Tki1draTZq1vpvfFbQrnZZDQqIYI00Rbq3vFvj',
  apiVersion: 'v1',
  tokenPrefix: 'Bearer ',
  tokenStorageKey: 'auth_token',
  httpTimeout: 30000,
  httpRetries: 2
};
