
interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

// Resend email service
export async function sendEmail({
  to,
  subject,
  html,
}: EmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("[Email] RESEND_API_KEY is not configured");

    return {
      success: false,
      error: "Email service not configured",
    };
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `TibebStore <${fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Email] Resend send failed:", {
        status: response.status,
        error: result,
        subject,
      });

      return {
        success: false,
        error: result.message || "Failed to send email",
        status: response.status,
      };
    }

    console.log("[Email] Successfully accepted by Resend:", {
      id: result.id,
      subject,
    });

    return {
      success: true,
      id: result.id,
    };
  } catch (error) {
    console.error("[Email] Resend error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown email sending error",
    };
  }
}

// Email templates

export function orderConfirmationEmail(order: {
  id: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
}): string {
  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">ETB ${item.price.toLocaleString()}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #429DFE; text-align: center;">Order Confirmed!</h1>
      <p style="text-align: center; color: #666;">Thank you for your order at TibebStore</p>

      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Order #${order.id.slice(-6).toUpperCase()}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #429DFE; color: white;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 12px 8px; text-align: right; font-weight: bold;">Total:</td>
              <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #429DFE;">ETB ${order.total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p style="text-align: center; color: #999; font-size: 12px;">
        You'll receive another email when your order ships.
      </p>
    </div>
  `;
}

export function orderShippedEmail(order: {
  id: string;
  trackingNumber?: string;
  carrier?: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #429DFE; text-align: center;">Your Order Has Shipped!</h1>

      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="font-size: 18px; margin-bottom: 20px;">Order #${order.id.slice(-6).toUpperCase()}</p>

        ${order.trackingNumber ? `
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="color: #666; margin: 0 0 5px 0;">Tracking Number</p>
            <p style="font-size: 18px; font-weight: bold; margin: 0;">${order.trackingNumber}</p>
            ${order.carrier ? `<p style="color: #666; margin: 5px 0 0 0;">via ${order.carrier}</p>` : ""}
          </div>
        ` : ""}

        <a href="https://tibeb-store.vercel.app/account/orders/${order.id}"
           style="display: inline-block; background: #429DFE; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 10px;">
          Track Your Order
        </a>
      </div>

      <p style="text-align: center; color: #999; font-size: 12px;">
        Thank you for shopping with TibebStore!
      </p>
    </div>
  `;
}

export function orderDeliveredEmail(order: {
  id: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10b981; text-align: center;">Your Order Has Been Delivered!</h1>

      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="font-size: 18px;">Order #${order.id.slice(-6).toUpperCase()}</p>

        <p style="color: #666; margin: 20px 0;">
          We hope you love your purchase! If you have any issues, please contact the seller.
        </p>

        <a href="https://tibeb-store.vercel.app/account/orders/${order.id}"
           style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 10px;">
          View Order Details
        </a>
      </div>

      <p style="text-align: center; color: #999; font-size: 12px;">
        Thank you for shopping with TibebStore!
      </p>
    </div>
  `;
}
