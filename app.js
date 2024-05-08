const express = require("express");
const bodyParser = require("body-parser");
const Razorpay = require("razorpay");
const WebSocket = require("ws");
const crypto = require("crypto");
const app = express();
const PORT = process.env.PORT || "3000";

// Initialize Razorpay instance with your API key and secret
const razorpayInstance = new Razorpay({
  key_id: "rzp_live_mSzRKyaR7Kr1uS", // Replace with your key_id
  key_secret: "yiCFU1DEjK7LgLDxLbDkMyXG", // Replace with your key_secret
});

// Middleware to parse JSON request body

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 }); // Use any available port

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("WebSocket client connected");
});

// Route to handle incoming webhook requests from Razorpay
app.post("/webhook", async (req, res) => {
  try {
    let body = req.body;
    let received_signature = req.get("x-razorpay-signature");
    let secret = "qwerasdfzxcv321";

    var success = Razorpay.validateWebhookSignature(
      JSON.stringify(body),
      received_signature,
      secret
    );
    if (success) {
      console.log("Invalid webhook Valid");
    } else {
      // Process the webhook event
      console.log("Webhook event received:", body);
      // Handle the webhook event according to your requirements

      // Send the event to connected WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(body));
        }
      });
    }
    // Send response to Razorpay confirming receipt of webhook
    res.status(200).end();
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).end();
  }
});
app.get("/", function (req, res) {
  res.status(200).send("Running");
});
app.listen(PORT, () => {
  console.log("Server is Listening on Port ", PORT);
});
