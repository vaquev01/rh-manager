import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
// In production: import Stripe from "stripe";
// import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature") as string;

    /*
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    
    let event: Stripe.Event;
  
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
  
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        
        // 1. Extract metadata (passed during checkout creation)
        const { tenantSlug, tenantName, adminEmail } = session.metadata || {};
  
        if (!tenantSlug || !adminEmail) {
           console.error("Missing metadata in checkout session");
           break;
        }
  
        // 2. Automate Provisioning (Prisma)
        // await prisma.$transaction(async (tx) => {
        //   const newTenant = await tx.tenant.create({
        //     data: { slug: tenantSlug, nome: tenantName, plano: "professional" }
        //   });
        //   
        //   await tx.user.create({
        //     data: { tenantId: newTenant.id, email: adminEmail, role: "ADMIN", ... }
        //   });
        // });
  
        // 3. Send welcome email (Resend)
        console.log(`✅ Provisioned new tenant ${tenantSlug} for ${adminEmail}`);
  
        break;
        
      case "customer.subscription.deleted":
        // Block access to tenant
        break;
  
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    */

    return NextResponse.json({ received: true }, { status: 200 });
}
