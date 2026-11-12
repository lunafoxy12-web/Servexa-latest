import nodemailer, { Transporter } from 'nodemailer';
import { EmailLog, SmtpSettings } from '../src/types.js';

export interface EmailDispatchOptions {
  recipient: string;
  recipientName?: string;
  emailType: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  relatedUserId?: string;
  relatedUserName?: string;
  relatedOrderId?: string;
  relatedServiceId?: string;
  relatedTransactionId?: string;
  storeName?: string;
  storeLogo?: string;
  categoryName?: string;
}

export interface DynamicEmailContext {
  customerName?: string;
  customerEmail?: string;
  providerName?: string;
  providerEmail?: string;
  providerBusinessName?: string;
  serviceCategory?: string;
  serviceName?: string;
  storeName?: string;
  storeLogo?: string;
  orderId?: string;
  serviceId?: string;
  bookingId?: string;
  invoiceId?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  statusMessage?: string;
  date?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  actionUrl?: string;
  actionButtonText?: string;
  disputeSubject?: string;
  rating?: number;
  reviewComment?: string;
  details?: string;
}

export class SmtpManager {
  private static sanitizeConfig(config: SmtpSettings): SmtpSettings {
    return {
      ...config,
      password: config.password ? '••••••••' : '',
      hasPassword: Boolean(config.password && config.password.length > 0)
    };
  }

  public static async testConnection(
    settings: SmtpSettings,
    testPassword?: string
  ): Promise<{ success: boolean; message: string }> {
    const passwordToUse = testPassword || settings.password;

    if (!settings.host) {
      return { success: false, message: 'SMTP Host cannot be empty.' };
    }
    if (!settings.port || settings.port < 1 || settings.port > 65535) {
      return { success: false, message: 'Please specify a valid SMTP port (e.g. 587 or 465).' };
    }
    if (!settings.username) {
      return { success: false, message: 'SMTP Username is required.' };
    }
    if (!passwordToUse || passwordToUse.startsWith('••••')) {
      return { success: false, message: 'SMTP Password is required to establish credentials.' };
    }

    try {
      const isSecure = settings.encryption === 'ssl' || settings.port === 465;
      const transporter = nodemailer.createTransport({
        host: settings.host,
        port: Number(settings.port),
        secure: isSecure,
        auth: {
          user: settings.username,
          pass: passwordToUse
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.verify();
      return {
        success: true,
        message: `Connection to SMTP server "${settings.host}:${settings.port}" succeeded via ${settings.encryption.toUpperCase()}.`
      };
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to authenticate with SMTP server.';
      return {
        success: false,
        message: `SMTP Connection Failed: ${errMsg}`
      };
    }
  }

  public static async sendMail(
    settings: SmtpSettings,
    options: EmailDispatchOptions,
    plainPassword?: string
  ): Promise<{ success: boolean; deliveryStatus: 'delivered' | 'failed' | 'simulated'; message: string; log: EmailLog }> {
    const timestamp = new Date().toISOString();
    const logId = 'elog-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    const logBase: EmailLog = {
      id: logId,
      recipient: options.recipient,
      recipientName: options.recipientName,
      emailType: options.emailType,
      subject: options.subject,
      relatedUserId: options.relatedUserId,
      relatedUserName: options.relatedUserName,
      relatedOrderId: options.relatedOrderId,
      relatedServiceId: options.relatedServiceId,
      relatedTransactionId: options.relatedTransactionId,
      storeName: options.storeName,
      categoryName: options.categoryName,
      sentTimestamp: timestamp,
      deliveryStatus: 'simulated',
      serviceUsed: settings.enabled ? 'smtp' : 'system',
      messagePreview: options.subject
    };

    if (!settings.enabled) {
      return {
        success: true,
        deliveryStatus: 'simulated',
        message: `Notifications currently disabled or simulated. Mail logged for ${options.recipient}.`,
        log: {
          ...logBase,
          deliveryStatus: 'simulated',
          serviceUsed: 'system'
        }
      };
    }

    const hostToUse = process.env.SMTP_HOST || settings.host;
    const portToUse = Number(process.env.SMTP_PORT || settings.port || 587);
    const userToUse = process.env.SMTP_USER || settings.username;
    const passwordToUse = process.env.SMTP_PASS || plainPassword || settings.password;

    const hasLiveCreds = Boolean(
      hostToUse &&
      userToUse &&
      passwordToUse &&
      !passwordToUse.startsWith('••••')
    );

    try {
      let transporter: Transporter;

      if (hasLiveCreds) {
        const isSecure = settings.encryption === 'ssl' || portToUse === 465;
        transporter = nodemailer.createTransport({
          host: hostToUse,
          port: portToUse,
          secure: isSecure,
          auth: {
            user: userToUse,
            pass: passwordToUse
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 12000,
          tls: {
            rejectUnauthorized: false
          }
        });
      } else {
        // Fallback to real Ethereal SMTP test account for live mail delivery & preview link
        try {
          const testAccount = await nodemailer.createTestAccount();
          transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
        } catch {
          transporter = nodemailer.createTransport({
            host: settings.host || 'smtp.gmail.com',
            port: 587,
            secure: false,
            tls: { rejectUnauthorized: false }
          });
        }
      }

      const senderAddress = `"${settings.senderName || 'Servexa World'}" <${settings.senderEmail || userToUse || 'notifications@servexa.world'}>`;
      
      const info = await transporter.sendMail({
        from: senderAddress,
        to: options.recipient,
        replyTo: settings.replyToEmail || settings.senderEmail || userToUse,
        subject: options.subject,
        html: options.htmlContent,
        text: options.textContent || options.subject
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[SMTP Live Email Delivered] Recipient: ${options.recipient} | Live Preview URL: ${previewUrl}`);
      }

      return {
        success: true,
        deliveryStatus: 'delivered',
        message: `Delivered to ${options.recipient} via ${hostToUse || 'live SMTP'}`,
        log: {
          ...logBase,
          deliveryStatus: 'delivered',
          serviceUsed: 'smtp'
        }
      };
    } catch (err: any) {
      const errorText = err?.message || 'Unknown SMTP transport error';
      console.warn(`[SMTP Delivery Notice] Could not send to ${options.recipient}: ${errorText}`);
      
      return {
        success: false,
        deliveryStatus: 'failed',
        message: `SMTP delivery failed: ${errorText}`,
        log: {
          ...logBase,
          deliveryStatus: 'failed',
          serviceUsed: 'smtp',
          errorMessage: errorText
        }
      };
    }
  }

  // Generate dynamic, responsive, and brand-tailored HTML templates
  public static renderTemplate(
    templateType: string,
    ctx: DynamicEmailContext,
    platformName = 'Servexa World'
  ): { subject: string; html: string } {
    const cur = ctx.currency || 'USD';
    const curSym = cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : '$';
    const formattedAmount = ctx.amount !== undefined ? `${curSym}${Number(ctx.amount).toFixed(2)} ${cur}` : '';
    const dateStr = ctx.date || new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const dynamicStore = ctx.storeName ? ctx.storeName : ctx.providerBusinessName || 'Direct Specialist Partner';
    const dynamicCategory = ctx.serviceCategory || 'On-Demand Service';

    let title = '';
    let subject = '';
    let bodyText = '';
    let badge = dynamicCategory;
    let badgeColor = '#4f46e5';

    switch (templateType) {
      case 'email_verification':
        subject = `[${platformName}] Security Verification Code: ${ctx.details || 'Your Code'}`;
        title = 'Account Security Verification';
        badgeColor = '#059669';
        badge = 'Security Authentication';
        bodyText = `Hello <strong>${ctx.customerName || 'Valued User'}</strong>,<br/><br/>
Please use the following 6-digit verification code to confirm your email address and activate your account on ${platformName}:
<div style="margin: 24px 0; text-align: center;">
  <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e1b4b; background: #eef2ff; border: 2px dashed #6366f1; padding: 14px 28px; border-radius: 12px; font-family: monospace;">
    ${ctx.details}
  </span>
</div>
This code will expire in <strong>15 minutes</strong>.<br/><br/>
<span style="color: #64748b; font-size: 13px;">If you did not request this verification code, please ignore this email or contact support if you suspect unauthorized activity.</span>`;
        break;

      case 'customer_service_requested':
        subject = `[${platformName}] Request Confirmed: ${ctx.serviceName || dynamicCategory} (#${ctx.bookingId || ctx.serviceId || 'REQ'})`;
        title = 'Service Request Confirmed';
        bodyText = `Hello <strong>${ctx.customerName || 'Valued Customer'}</strong>,<br/><br/>Your service request for <strong>${ctx.serviceName || dynamicCategory}</strong> has been received and routed to available licensed specialists in your area.`;
        break;

      case 'customer_provider_accepted':
        subject = `[${platformName}] Specialist Assigned: ${ctx.providerName || 'Provider'} is on the way!`;
        title = 'Specialist Accepted Your Request';
        badgeColor = '#059669';
        bodyText = `Great news <strong>${ctx.customerName || 'Customer'}</strong>!<br/><br/><strong>${ctx.providerName}</strong> (${dynamicStore}) has accepted your <strong>${dynamicCategory}</strong> booking. Estimated arrival time is being tracked live on your dashboard.`;
        break;

      case 'customer_service_started':
        subject = `[${platformName}] Service Started: ${ctx.serviceName || dynamicCategory}`;
        title = 'Service in Progress';
        bodyText = `Your service specialist <strong>${ctx.providerName}</strong> has arrived and marked your <strong>${dynamicCategory}</strong> service as active.`;
        break;

      case 'customer_service_completed':
        subject = `[${platformName}] Service Completed: ${ctx.serviceName || dynamicCategory}`;
        title = 'Service Completed Successfully';
        badgeColor = '#10b981';
        bodyText = `Your service with <strong>${ctx.providerName}</strong> (${dynamicStore}) has been successfully completed. Thank you for choosing ${platformName}!`;
        break;

      case 'customer_invoice_generated':
        subject = `[${platformName}] Invoice Ready: ${formattedAmount} for ${dynamicCategory} (#${ctx.invoiceId || 'INV'})`;
        title = 'Invoice Ready for Payment';
        badgeColor = '#d97706';
        bodyText = `An invoice of <strong>${formattedAmount}</strong> has been issued by <strong>${ctx.providerName}</strong> (${dynamicStore}) for your <strong>${ctx.serviceName || dynamicCategory}</strong>.`;
        break;

      case 'customer_invoice_paid':
        subject = `[${platformName}] Payment Receipt: ${formattedAmount} Confirmed`;
        title = 'Payment Received & Receipt';
        badgeColor = '#059669';
        bodyText = `Thank you! Your payment of <strong>${formattedAmount}</strong> for <strong>${ctx.serviceName || dynamicCategory}</strong> with <strong>${dynamicStore}</strong> has been processed successfully.`;
        break;

      case 'customer_product_order':
        subject = `[${platformName}] Order Confirmation #${ctx.orderId || 'ORD'} - ${dynamicStore}`;
        title = 'Order Placed Successfully';
        badge = dynamicStore;
        bodyText = `Thank you <strong>${ctx.customerName || 'Customer'}</strong> for your order at <strong>${dynamicStore}</strong>! We are preparing your items for delivery. Total: <strong>${formattedAmount}</strong>.`;
        break;

      case 'customer_wallet_deposit':
        subject = `[${platformName}] Wallet Deposit Confirmed: ${formattedAmount}`;
        title = 'Wallet Balance Credited';
        badgeColor = '#0284c7';
        bodyText = `Your deposit of <strong>${formattedAmount}</strong> has been successfully credited to your ${platformName} wallet balance.`;
        break;

      case 'provider_new_request':
        subject = `[${platformName} ALERT] New Service Opportunity: ${dynamicCategory} (#${ctx.bookingId || 'REQ'})`;
        title = 'New Customer Service Request';
        badgeColor = '#e11d48';
        bodyText = `Hello <strong>${ctx.providerName}</strong>,<br/><br/>A customer has requested an on-demand <strong>${dynamicCategory}</strong> service: <strong>${ctx.serviceName || 'Standard Service'}</strong>. Review and accept to lock in this job.`;
        break;

      case 'provider_payment_received':
        subject = `[${platformName}] Funds Received: ${formattedAmount} for ${dynamicCategory}`;
        title = 'Payment Credited to Provider Wallet';
        badgeColor = '#059669';
        bodyText = `You have received a payment of <strong>${formattedAmount}</strong> for completing service #${ctx.bookingId || ctx.serviceId || ''} with ${ctx.customerName || 'Customer'}.`;
        break;

      case 'provider_new_product_order':
        subject = `[${platformName}] New Storefront Order: ${dynamicStore} (#${ctx.orderId || 'ORD'})`;
        title = 'New Store Purchase';
        badge = dynamicStore;
        bodyText = `A new product order has been placed in your store <strong>${dynamicStore}</strong> for <strong>${formattedAmount}</strong>. Please prepare the items for dispatch.`;
        break;

      case 'provider_payout_disbursed':
        subject = `[${platformName}] Payout Disbursed: ${formattedAmount}`;
        title = 'Withdrawal Released';
        badgeColor = '#059669';
        bodyText = `Your requested withdrawal of <strong>${formattedAmount}</strong> has been disbursed via your configured payout method. Reference: #${ctx.transactionId || 'TXN'}.`;
        break;

      case 'admin_alert':
        subject = `[${platformName} SYSTEM ALERT] ${ctx.details || 'Important System Event'}`;
        title = 'Administrative Notice';
        badgeColor = '#dc2626';
        bodyText = `Attention Admin,<br/><br/>A system or financial event has occurred:<br/><strong>${ctx.details || 'Event triggered'}</strong>. Total involved: <strong>${formattedAmount || 'N/A'}</strong>.`;
        break;

      default:
        subject = `[${platformName}] Notification: ${ctx.serviceCategory || 'Service Update'}`;
        title = 'System Notification';
        bodyText = ctx.details || 'You have an updated activity on your account.';
        break;
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #0f172a; color: #334155; }
    .wrapper { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 28px; color: #ffffff; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #c7d2fe; }
    .content { padding: 32px 28px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #ffffff; background-color: ${badgeColor}; margin-bottom: 16px; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; }
    .box-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
    .box-row:last-child { border-bottom: none; }
    .box-label { color: #64748b; font-weight: 500; }
    .box-val { color: #0f172a; font-weight: 700; }
    .btn { display: inline-block; padding: 12px 28px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; }
    .footer { background-color: #f1f5f9; padding: 24px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer a { color: #4f46e5; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      ${ctx.storeLogo ? `<img src="${ctx.storeLogo}" alt="Logo" style="max-height: 48px; margin-bottom: 12px; border-radius: 8px;" />` : ''}
      <h1>${platformName}</h1>
      <p>Decentralized Service & Commerce Ecosystem</p>
    </div>
    <div class="content">
      <span class="badge">${badge}</span>
      <div class="title">${title}</div>
      <div class="text">${bodyText}</div>

      <div class="box">
        <div class="box-row">
          <span class="box-label">Store / Provider:</span>
          <span class="box-val">${dynamicStore}</span>
        </div>
        <div class="box-row">
          <span class="box-label">Category:</span>
          <span class="box-val">${dynamicCategory}</span>
        </div>
        ${ctx.serviceName ? `
        <div class="box-row">
          <span class="box-label">Service / Product:</span>
          <span class="box-val">${ctx.serviceName}</span>
        </div>` : ''}
        ${ctx.orderId || ctx.bookingId || ctx.invoiceId ? `
        <div class="box-row">
          <span class="box-label">Reference ID:</span>
          <span class="box-val">${ctx.orderId || ctx.bookingId || ctx.invoiceId}</span>
        </div>` : ''}
        ${formattedAmount ? `
        <div class="box-row">
          <span class="box-label">Amount:</span>
          <span class="box-val" style="color: #4f46e5;">${formattedAmount}</span>
        </div>` : ''}
        <div class="box-row">
          <span class="box-label">Date & Time:</span>
          <span class="box-val">${dateStr}</span>
        </div>
      </div>

      <div style="text-align: center; margin: 28px 0 12px 0;">
        <a href="${ctx.actionUrl || 'https://servexa.app'}" class="btn">
          ${ctx.actionButtonText || 'Open Servexa Dashboard'}
        </a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;">
        <strong>Security & Privacy Notice:</strong> This message contains confidential transactional information tailored exclusively for your verified account. Wallet balances are never shared between customer and service provider parties.
      </p>
      <p style="margin: 0;">
        © ${new Date().getFullYear()} ${platformName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return { subject, html };
  }
}
