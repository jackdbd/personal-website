import type Stripe from 'stripe'

export const STRIPE_CONFIG = {
  // https://stripe.com/docs/api/versioning
  apiVersion: '2022-11-15' as Stripe.LatestApiVersion,
  maxNetworkRetries: 3, // (default is 0)
  timeout: 10000 // ms (default is 80000)
}

export enum PriceLookupKey {
  CodeReviewCustomerChooses = 'code_review_customer_chooses',
  CodeReviewOneTime = 'code_review_one_time',
  ConsultationCustomerChooses = 'consultation_customer_chooses',
  ConsultationOneTime = 'consultation_one_time',
  DeveloperAsAServiceDaily = 'daas_recurring_daily',
  WebsiteAuditOneTime = 'website_audit_one_time'
}

/**
 * A valid credit card that requires no Strong Customer Authentication.
 * https://stripe.com/docs/testing
 */
export const PAYMENT_METHOD_VALID_CARD_NO_SCA_REQUEST_BODY = {
  card: {
    cvc: '123',
    exp_month: 12,
    exp_year: 2030,
    number: '4242424242424242'
  } as Stripe.PaymentMethodCreateParams.Card1,
  type: 'card' as Stripe.PaymentMethodCreateParams.Type
}

/**
 * Price unit amounts in USD cents.
 *
 * I define prices here so they are easy to find and update.
 */
export enum PriceUnitAmountInUSDCents {
  CodeReviewOneTime = 30000, // 300 USD
  ConsultationOneTime = 15000,
  DeveloperAsAServiceDaily = 100,
  WebsiteAuditOneTime = 30000
}
