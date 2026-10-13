// Interruptor temporal para el pago con tarjeta (Stripe). En false: el modal
// de compra (components/BuyButton.tsx) solo ofrece transferencia bancaria, y
// app/api/checkout/route.ts rechaza cualquier intento con 503. El flujo de
// transferencia (app/api/enroll-transfer/route.ts) no depende de esto, sigue
// funcionando igual en ambos casos.
//
// Para reactivar el pago con tarjeta, cambiar esta línea a `true` — no hace
// falta tocar nada más, ni en BuyButton.tsx ni en checkout/route.ts.
export const STRIPE_CHECKOUT_ENABLED = false;
