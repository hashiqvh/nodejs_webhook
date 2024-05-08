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
app.use(bodyParser.json());

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 }); // Use any available port

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("WebSocket client connected");
});

// Route to handle incoming webhook requests from Razorpay
app.post("/webhook", (req, res) => {
  const webhookSignature = req.get("x-razorpay-signature");
  const { body } = req;
  const signature = req.body.razorpay_signature;
  const key = "qwerasdfzxcv321";
  console.error("Invalid webhook signature");
  try {
    var message = req.body;
    const received_signature = req.get("x-razorpay-signature");
    // Verify the payment signature
    const isSignatureValid = razorpayInstance.validateWebhookSignature(
      req.headers["x-razorpay-signature"],
      req.rawBody
    );

    if (!isSignatureValid) {
      return res.status(400).send("Invalid payment callback");
    }
    // Process the webhook event
    console.log("Webhook event received:", body);
    // Handle the webhook event according to your requirements

    // Send the event to connected WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(body));
      }
    });

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
