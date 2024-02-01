const express = require("express");
const router = express.Router();
const Offer = require("../models/Offer");
const fileUpload = require("express-fileupload");
const isAuthenticated = require("../middlewares/isAuthenticated");
const { uploadToCloudInary } = require("../utils/utils");
// const cloudinary = require("cloudinary").v2;
// const convertToBase64 = require("../utils/utils");

router.get("/offers", async (req, res) => {
  try {
    if (!req.query) {
      res.status(400).json({ message: "Bad request" });
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
      if (req.body.description.length > 500) {
        return res.status(400).json({
          message: "description length over 500 characters",
        });
      }

      if (req.body.name.length > 50) {
        return res.status(400).json({
          message: "product name length over 50 characters",
        });
      }

      if (req.body.price > 100000) {
        return res.status(400).json({
          message: "product price over 100 000 $",
        });
      }

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
        if (req.files.picture.length > 5) {
          res.status(500).json({
            message: "Unable to create offer, pictures quantity over 5",
          });
        }

        const uploadedImages = [];
        for (let i = 0; i < req.files.picture.length; i++) {
          uploadedImages.push(
            await uploadToCloudInary(
              "offers",
              req.files.picture[i],
              newOffer._id + "-" + i.toString()
            )
          );
        }
        newOffer.product_image = uploadedImages;
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
    res.status(200).json({ message: "Deleted" });
  } else {
    res.status(400).json({ message: "Unable to delete" });
  }
});

router.put("/offer/modify/:id", fileUpload(), async (req, res) => {
  try {
    const { name, description, price, brand, size, color, condition, city } =
      req.query;
    if (
      !name ||
      !description ||
      !price ||
      !brand ||
      !size ||
      !color ||
      !condition ||
      !city
    ) {
      return res.status(400).json({ message: "Missing parameters" });
    }
    const modifiedOffer = await Offer.findById(req.params.id);
    if (!modifiedOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    modifiedOffer.product_name = name;
    modifiedOffer.product_description = description;
    modifiedOffer.product_price = price;
    modifiedOffer.product_details = {
      MARQUE: brand,
      TAILLE: size,
      COULEUR: color,
      ETAT: condition,
      EMPLACEMENT: city,
    };

    await modifiedOffer.save();
    return res.status(200).json({ message: "Your offer has been modified" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
