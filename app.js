const express = require("express");
const bodyParser = require("body-parser");
const Razorpay = require("razorpay");
const WebSocket = require("ws");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || "3000";

// Initialize Razorpay instance with your API key and secret
const razorpayInstance = new Razorpay({
  key_id: "YOUR_KEY_ID", // Replace with your key_id
  key_secret: "YOUR_KEY_SECRET", // Replace with your key_secret
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
app.post("/webhook", async (req, res) => {
  const { body, headers } = req;

  // Verify the webhook signature
  const key = "qwerasdfzxcv321"; // Replace with your webhook secret
  const payload = JSON.stringify(body);
  const signature = headers["x-razorpay-signature"];

  try {
    // Recreate the signature using the provided payload and secret key
    const generatedSignature = crypto
      .createHmac("sha256", key)
      .update(payload)
      .digest("hex");
      console.log("Generated Signature:", generatedSignature);
      console.log("Received Signature:", signature);
    // Compare the generated signature with the received signature
    if (signature !== generatedSignature) {
      console.error("Invalid webhook signature");
      return res.status(400).end();
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

// Route to check if the server is running
app.get("/", function (req, res) {
  res.status(200).send("Server is running");
});

app.listen(PORT, () => {
  console.log("Server is Listening on Port ", PORT);
});