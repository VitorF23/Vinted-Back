const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer");
const fileUpload = require("express-fileupload");
const isAuthenticated = require("../middlewares/isAuthenticated");
const { uploadToCloudInary } = require("../utils/utils");
const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("../utils/utils");

router.get("/offers", async (req, res) => {
  try {
    if (!req.query) {
      res.status(500).json({ message: "Bad request" });
    }

    const { title, priceMin, priceMax, sort, page } = req.query;

    const elementInPages = 10;

    let findParams = {};
    if (title) {
      findParams = { product_name: new RegExp(title, "i") };
    }

    if (priceMin) {
      findParams = {
        ...findParams,
        product_price: {
          $gte: priceMin,
        },
      };
    }

    if (priceMax) {
      findParams = {
        ...findParams,
        product_price: {
          ...findParams.product_price,
          $lte: priceMax,
        },
      };
    }

    let sortParams = {};
    if (sort === "price-desc") {
      sortParams = {
        product_price: "desc",
      };
    } else if (sort === "price-asc") {
      sortParams = {
        product_price: "asc",
      };
    }

    const offers = await Offer.find(findParams)
      .select()
      .sort(sortParams)
      .limit(elementInPages)
      .skip((page - 1) * elementInPages);

    const apiRes = {
      count: offers.length,
      offers: offers,
    };

    return res.status(200).json(apiRes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const IDoffer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });

    res.status(200).json(IDoffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const newOffer = new Offer({
        product_name: req.body.name,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          { MARQUE: req.body.brand },
          { TAILLE: req.body.size },
          { COULEUR: req.body.color },
          { ETAT: req.body.condition },
          { EMPLACEMENT: req.body.city },
        ],
        owner: req.user,
      });

      if (req.files) {
        const product_image_url = uploadToCloudInary(
          "offers",
          req.files.picture,
          newOffer._id
        );
        newOffer.product_image = product_image_url;
      }

      await newOffer.save();
      return res.status(200).json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.delete("/offer/delete/:id", async (req, res) => {
  const deletedoffer = await Offer.findByIdAndDelete(req.params.id);

  if (deletedoffer) {
    res.status(201).json({ message: "Deleted" });
  } else {
    res.status(400).json({ message: "Unable to delete" });
  }
});

module.exports = router;
