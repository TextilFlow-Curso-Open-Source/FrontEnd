export const environment = {
  production: true,

  // Backend real URL
  serverBaseUrl: 'http://3.135.127.195:5001/api/v1',

  // Endpoints que coinciden con tu backend Spring Boot
  authEndpointPath: '/authentication',
  userEndpointPath: '/users',
  businessmanEndpointPath: '/businessmen',
  supplierEndpointPath: '/suppliers',
  profileEndpointPath: '/profiles',
  businessSupplierRequests: '/business-supplier-requests',

  // Endpoints para imágenes de perfil - SIN placeholder
  profileImagesEndpointPath: '/profiles',

  // Resto igual...
  batchesEndpointPath: '/batches',
  supplierReviewEndpointPath: '/supplierReviews',
  observationEndpointPath: '/observation',
  configurationEndpointPath: '/configuration',
  apiVersion: 'v1',
  tokenPrefix: 'Bearer ',
  tokenStorageKey: 'auth_token',
  httpTimeout: 30000,
  httpRetries: 2
};
