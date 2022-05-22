var stripe = require("stripe")("")
var express = require("express")

var app = express()
app.use(express.static("public"))
app.use(express.urlencoded({ extended:true }))

app.use(express.json())

var port = 3000

var your_domain = "http://localhost:3001"


app.get("/", async (req,res) => {
    res.send("<h2>This is the home page</h2>")
})

app.post("/create-checkout-session", async(req, res) => {
    var prices = await prices_list.list({
        lookup_keys: [req.body.lookup_key],
        expand: ["data.product"],
    });

    var session = await stripe.checkout.sessions.create({
        billing_address_collection: "auto",
        line_items: [
            {
                price: prices.data[0].id,
                //for meteres quantity do not pass quantity
                quantity: 1,

            },
        ],
        mode: "subscription",
        success_url: `${your_domain}/success.html?session_id={checkout_session_id}`,
        cancel_url: `${your_domain}/cancel.html`,
    })

    res.redirect(303, session.url)

})


app.post("/create-portal-session", async (req, res) => {
    var { session_id} = req.body;
    var checkoutSession = await stripe.checkout.sessions.retrieve(session_id);


    var redirect_url = your_domain;

    var portalSession = await stripe.billingPortal.sessions.create({
        customer: checkoutSession.customer,
        return_url: returnUrl,
    })
    res.redirect(303, portalSession.url)
})






app.post('/webhook', express.raw({ type: "application/json"}), 
(express, response) => {
    let event = request.body;

    const endpointSecret = "whsec_12345";

    if(endpointSecret) {
        var signature = request.headers["stripe-signature"];
        try {
            event = stripe.webhooks.constructEvent(
                request.body, signature, endpointSecret
            )
        }
        catch (err) {
            console.log(`Webhook signature verification failed`, err.message);
            return response.sendStatus(400);
        }
    }

    let subscription;
    let status;

    //handle the event
    switch(event.type) {
        case "customer.subscription.trial_will_end":
            subscription = event.data.object;
            status = subscription.status;
            console.log(`subscription status is ${status}`)
            break

        case "customer.subscription.deleted":
            subscription = event.data.object;
            status = subscription.status;
            console.log(`subscription status is ${status}`)
            break
        
        case "customer.subscription.created":
            subscription = event.data.object;
            status = subscription.status;
            console.log (`subscription status is ${status}`)
            break;

        default:
            //unexpected data type
            console.log(`unhandled event type ${event.type}`);            
    }

    //return a 200 response to acknowledged receipt of the event
    response.send()
})


app.listen(port, () => {
    console.log('server running')
})