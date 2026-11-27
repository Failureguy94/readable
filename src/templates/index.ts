import { OrderConfirmation } from "./order-confirmation";
import { ShippingUpdate } from "./shipping-update";
import { PasswordReset } from "./password-reset";
import { SignInAlert } from "./sign-in-alert";

export { OrderConfirmation, ShippingUpdate, PasswordReset, SignInAlert };

/** The suite, in the order the site and the reports show it. */
export const TEMPLATES = [
  { slug: "order-confirmation", template: OrderConfirmation },
  { slug: "shipping-update", template: ShippingUpdate },
  { slug: "password-reset", template: PasswordReset },
  { slug: "sign-in-alert", template: SignInAlert },
] as const;
