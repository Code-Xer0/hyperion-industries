import { DigitalProductValidationError, DIGITAL_PRODUCT_PRICES, compileDigitalProduct, productPreview, type ProductConfiguration } from './digital-products';
import { HttpError, jsonResponse, readJsonBody, rejectUnknownFields, requireObject } from './http';

export function handleCommerceReadiness() {
  return jsonResponse({
    contract_version: 'hyperion.commerce-readiness/2',
    release_state: 'sandbox_setup_required',
    public_checkout_enabled: false,
    digital_products: Object.entries(DIGITAL_PRODUCT_PRICES).map(([id, price_minor]) => ({ id, price_minor, currency: 'USD' })),
    providers: {
      paypal: { role: 'primary', mode: 'sandbox', configuration: 'required' },
      stripe: { role: 'standby', mode: 'sandbox', configuration: 'required' },
    },
  }, 200, { 'cache-control': 'no-store' });
}

export async function handleDigitalProductPreview(request: Request) {
  const body = requireObject(await readJsonBody(request, 12_000));
  rejectUnknownFields(body, ['product_id', 'configuration', 'projections']);
  const configuration = requireObject(body.configuration) as unknown as ProductConfiguration;
  const projections = body.projections === undefined ? undefined : body.projections;
  if (projections !== undefined && (!Array.isArray(projections) || projections.some((item) => typeof item !== 'string'))) {
    throw new HttpError(400, 'invalid_request', 'Projections must be a list of supported names.');
  }
  try {
    const compiled = await compileDigitalProduct({
      product_id: String(body.product_id ?? ''),
      configuration,
      ...(projections === undefined ? {} : { projections: projections as string[] }),
      buyer: { name: 'Preview only', verifiedEmail: 'preview@example.invalid', licenseId: 'lic_preview00000000' },
    });
    return jsonResponse({
      contract_version: 'hyperion.digital-product-preview/1',
      checkout_enabled: false,
      preview: productPreview(compiled),
    });
  } catch (error) {
    if (error instanceof DigitalProductValidationError) {
      throw new HttpError(422, error.code, error.issues.join(' '));
    }
    throw error;
  }
}
