const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_API_SECRET);

router.post("/payment", async (req, res) => {
  try {
    const { stripeToken, totalPrix, title } = req.body;
    const charge = await stripe.charges.create({
      amount: Number((totalPrix * 100).toFixed(0)),
      currency: "eur",
      description: title,
      source: stripeToken,
    });
    return res.status(200).json(charge);
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;
