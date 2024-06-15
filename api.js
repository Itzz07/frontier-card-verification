const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid"); // Import uuidv4 function
const app = express();
const port = 3000;

dotenv.config();
// app.use(bodyParser.json());
// Enable JSON parsing for request body
app.use(express.json());
// Serve static files
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/start.html");
});

const getToken = async () => {
  try {
    const response = await axios.post(
      process.env.API,
      {
        service: process.env.SERVICE,
        data: {
          authID: process.env.AUTH_ID,
          authPassword: process.env.AUTH_PASSWORD,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log("Error fetching token:", error);
    throw error;
  }
};

// Endpoint for charging the card on online CheckOut
app.post("/charge-card", async (req, res) => {
  try {
    const token = await getToken();
    // console.log("view token: "+ token.data.authToken);

    // Generate UUID
    const uuid = uuidv4();
    const {
      data: {
        authScheme,
        resultURL,
        storeCard,
        firstName,
        lastName,
        email,
        phone,
        narration,
        currency,
        amount,
      },
    } = req.body;

    // console.log("Received request:", req.body);

    const chargeCardResponse = await axios.post(
      process.env.API,
      {
        service: "ChargeCard",
        externalReference: uuid, // Use generated UUID
        data: {
          authScheme: authScheme,
          resultURL: resultURL,
          storeCard: storeCard,
          cofAgreementID: uuid, // Use generated UUID
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phone,
          narration: narration,
          currency: currency,
          amount: amount,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token.data.authToken}`,
        },
      }
    );

    // console.log("Charge card response:", chargeCardResponse.data);

    // while(chargeCardResponse.data.code == 'Success' && chargeCardResponse.data.status == 'Success'){
    // Create a document in Firestore with the payment details
    // await paymentDataRef.set({
    //   firstName,
    //   lastName,
    //   email,
    //   phone,
    //   tokenId: "",
    //   timestamp: admin.firestore.FieldValue.serverTimestamp(),
    //   externalReference: uuid,
    //   paybossRef: "",
    //   status: "",
    //   amount: amount,
    //   collectionDate: "",
    // });

    // console.log("Payment data successfully.");

    res.json(chargeCardResponse.data);
  } catch (error) {
    // console.error("Error charging card:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
