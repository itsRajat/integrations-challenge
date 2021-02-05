import {
  ClientIDSecretCredentials,
  ParsedAuthorizationResponse,
  ParsedCaptureResponse,
  PayPalOrder,
  ProcessorConnection,
  RawAuthorizationRequest,
  RawCancelRequest,
  RawCaptureRequest,
} from '@primer-io/app-framework';

/**
 * Use the HTTP Client to make requests to PayPal's orders API
 */
import HTTPClient from '../common/HTTPClient';

/**
 * Encodes clientId & clientSecret into Base64 & formats it
 */
const btoa = (clientId, clientSecret) => {
  return Buffer.from(clientId + ':' + clientSecret).toString('base64');
};

const PayPalConnection: ProcessorConnection<
  ClientIDSecretCredentials,
  PayPalOrder
> = {
  name: 'PAYPAL',

  website: 'https://paypal.com',

  /**
   * Sandbox Configuration. Hardcoding them for the purpose of this challenge, but otherwise would probably use an ENV file.
   */
  configuration: {
    accountId: 'bussinessacc2@gmail.com',
    clientId:
      'AfFbU3UwKOVAO1xu6XDYg1rIV4prE5b0thrulioxhaLBb0_e7zt3ez0pb-DrSLM7l4cwixPGNWRH4jQX',
    clientSecret:
      'EKVFd1dvtcUegT3QTkdkkyZTO4k4Rzs_L3toF-3c95BR43ibwOMTFSLm-soCw3_K9_mri2XDS2IqkWGs',
  },

  /**
   * Authorize a PayPal order
   * Use the HTTPClient and the request info to authorize a paypal order
   */
  async authorize(
    request: RawAuthorizationRequest<ClientIDSecretCredentials, PayPalOrder>,
  ): Promise<ParsedAuthorizationResponse> {
    /**
     * Using the order ID passed from Client
     */
    const orderId = request.paymentMethod.orderId;

    /**
     * Saving our base64 encoded client ID & Secret to use later
     */
    const accessToken = btoa(
      request.processorConfig.clientId,
      request.processorConfig.clientSecret,
    );

    const authResponse = await HTTPClient.request(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/authorize`,
      {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${accessToken}`,
          'PayPal-Request-Id': '7b92603e-77ed-4896-8e78-5dea2050476a',
        },
        body: '',
      },
    );

    /**
     * Converting our response into JSON & extracting status and authorization ID from it.
     */
    const responseAsJSON = JSON.parse(authResponse.responseText);
    const status = responseAsJSON.status;
    const authorizationId =
      responseAsJSON.purchase_units[0].payments.authorizations[0].id;

    /**
     * Encodes clientId & clientSecret into Base64 & formats it
     */
    switch (status) {
      case 'COMPLETED':
        return {
          transactionStatus: 'AUTHORIZED',
          processorTransactionId: authorizationId,
        };
      case 'SAVED':
        return {
          transactionStatus: 'SETTLING',
          processorTransactionId: authorizationId,
        };
      // More cases can be filled here.
      default:
        /**
         *  Unknown status or something unprecented happens, throw an error message.
         */
        return {
          transactionStatus: 'FAILED',
          errorMessage: 'Unknown status: ' + status,
        };
    }
  },

  /**
   * Cancel a PayPal order
   * Use the HTTPClient and the request information to cancel the PayPal order
   */
  async cancel(
    request: RawCancelRequest<ClientIDSecretCredentials>,
  ): Promise<ParsedCaptureResponse> {
    /**
     * Auth ID from authorize()
     */
    const authorizationId = request.processorTransactionId;

    const accessToken = btoa(
      request.processorConfig.clientId,
      request.processorConfig.clientSecret,
    );

    /**
     * Send a request to void the authorization (onCancel)
     */
    const voidAuthorization = await HTTPClient.request(
      `https://api.sandbox.paypal.com/v2/payments/authorizations/${authorizationId}/void`,
      {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${accessToken}`,
        },
        body: '',
      },
    );

    /**
     * If the statusCode isn't 204, we know something unexpected happened so we throw error.
     * Else we return ParsedCaptureResponse with transactionStatus of 'CANCELLED'
     */
    if (voidAuthorization.statusCode != 204)
      throw new Error(JSON.parse(voidAuthorization.responseText).error);
    return {
      transactionStatus: 'CANCELLED',
    };
  },

  /**
   * Capture a PayPal order (You can ignore this method for the exercise)
   */
  /**
   *
   * This was just an attempt, not sure whether this works or not. As it wasn't required for the exercise,
   * I didn't spend much time on it.
   */
  async capture(
    request: RawCaptureRequest<ClientIDSecretCredentials>,
  ): Promise<ParsedCaptureResponse> {
    const authId = request.processorTransactionId;

    const accessToken = btoa(
      request.processorConfig.clientId,
      request.processorConfig.clientSecret,
    );

    const captureResponse = await HTTPClient.request(
      `https://api-m.paypal.com/v2/payments/authorizations/${authId}/capture`,
      {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: '',
      },
    );

    if (captureResponse.statusCode != 204)
      throw new Error(JSON.parse(captureResponse.responseText).error);
    return {
      transactionStatus: 'SETTLED',
    };
  },
};

export default PayPalConnection;
