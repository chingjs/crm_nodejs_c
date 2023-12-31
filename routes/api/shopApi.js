require("dotenv").config();
const express = require("express");
const AWS = require("aws-sdk");
const Address = require("../../config/tables/user/Address");
const User = require("../../config/tables/user/User");

const Cart = require("../../config/tables/user/Cart");
const { authorizeMw } = require("../../config/middlewares/authorize");
const Category = require("../../config/tables/settings/item/Category");
const CategoryChoice = require("../../config/tables/settings/CategoryChoice");
const Product = require("../../config/tables/settings/item/Product");

//Transaction
const Order = require("../../config/tables/transaction/Order");
const OrderItems = require("../../config/tables/transaction/OrderItems");
const Rating = require("../../config/tables/settings/Rating");
const Inventory = require("../../config/tables/settings/Inventory");
const {
  genNewTrackingNum,
  getTotalEarn,
} = require("../../config/functions/misc");
const VoucherType = require("../../config/tables/settings/voucher/VoucherType");
const { placeOrder } = require("../../config/functions/integrate");

const Voucher = require("../../config/tables/settings/voucher/Voucher");
const { giveUserPoint } = require("../../config/functions/helperFunctions");
const router = express.Router();

// Reward page
router.post("/pointshop/fetch", async (req, res) => {
  const shops = [];
  try {
    const pointshop = await Category.findAll({
      where: { active: true },
      include: [{ model: CategoryChoice }, { model: Product }],
    });

    const vouchershop = await Category.findAll({
      where: { active: true },
      include: [{ model: CategoryChoice }, { model: VoucherType }],
    });

    for (let p = 0; p < pointshop.length; p++) {
      if (!shops.includes(pointshop[p].productId) && pointshop[p].productId) {
        shops.push({
          image: `https://test-2023.s3.ap-southeast-1.amazonaws.com/${pointshop[p].product.dataValues.itemImage}`,
          imageBM: `https://test-2023.s3.ap-southeast-1.amazonaws.com/${pointshop[p].product.dataValues.bmItemImage}`,
          imageCH: `https://test-2023.s3.ap-southeast-1.amazonaws.com/${pointshop[p].product.dataValues.chItemImage}`,
          id: pointshop[p].product.dataValues.id,
          type: "Item",
          categoryId: pointshop[p].id,
          name: pointshop[p].product.itemName,
          point: pointshop[p].product.points,
          filter_by: pointshop[p].product.filter_by,
        });

        shops.push({
          image: `https://test-2023.s3.ap-southeast-1.amazonaws.com/${pointshop[p].product.dataValues.itemImage}`,
          imageBM: `https://test-2023.s3.ap-southeast-1.amazonaws.com/${pointshop[p].product.dataValues.bmItemImage}`,
          imageCH: `https://test-2023.s3.ap-southeast-1.amazonaws.com/${pointshop[p].product.dataValues.chItemImage}`,
          id: pointshop[p].product.dataValues.id,
          name: pointshop[p].product.itemName,
          // type: 'Item',
          type: pointshop[p].categoryChoice.dataValues.name,
          categoryId: pointshop[p].id,
          point: pointshop[p].product.points,
          category: "All",
          filter_by: pointshop[p].product.filter_by,

        });
      }
    }

    for (let v = 0; v < vouchershop.length; v++) {
      if (vouchershop[v].voucherType) {
        shops.push({
          image: `https://test-2023.s3.ap-southeast-1.amazonaws.com/${vouchershop[v].voucherType.voucherImage}`,
          id: vouchershop[v].voucherType.dataValues.id,
          type: "Voucher",
          categoryId: vouchershop[v].id,
          name: vouchershop[v].voucherType.name,
          point: vouchershop[v].voucherType.points,
        });

        shops.push({
          image: `https://test-2023.s3.ap-southeast-1.amazonaws.com/${vouchershop[v].voucherType.voucherImage}`,
          id: vouchershop[v].voucherType.id,
          name: vouchershop[v].voucherType.name,
          type: vouchershop[v].voucherType.type,
          categoryId: vouchershop[v].id,
          point: vouchershop[v].voucherType.points,
          category: "All",
        });
      }
    }

    return res.status(200).json({ shops: shops });
  } catch (err) {
    console.error("Error when finding all point shop");
    console.error(err);
    return res.status(400).json({ error: "Internal Error" });
  }
});


// rewardItems
router.post("/item/check", authorizeMw, async (req, res) => {
  const { categoryId } = req.body;

  let available = 0;
  if (!categoryId) {
    return res.status(400).json({ error: "Missing Data" });
  }

  try {
    const pointshop = await Category.findOne({
      where: { id: categoryId },
      include: [{ model: Product }, { model: VoucherType }],
    });
    if (!pointshop) {
      return res.status(400).json({ error: "Data Not found" });
    }

    if (pointshop.product) {
      const foundInv = await Inventory.findOne({
        where: { productId: pointshop.productId },
      });
      let currentBal = pointshop.product.totalBalance - foundInv.usedCount;
      available += currentBal;
    } else if (pointshop.voucherType) {
      const foundVou = await Voucher.findAll({
        where: {
          voucherTypeId: pointshop.voucherType.id,
          redeemed: false,
          shopper: false,
        },
      });
      available += foundVou.length;
    }

    const image = `https://test-2023.s3.ap-southeast-1.amazonaws.com/${
      pointshop.product
        ? pointshop.product.itemImage
        : pointshop.voucherType.dataValues.voucherImage
    }`;

    const getPointShops = {
      ...pointshop.dataValues,
      points: pointshop.product
        ? pointshop.product.points
        : pointshop.voucherType.dataValues.points,
      image,
      available,
      descriptions: pointshop.product
        ? pointshop.product.description
        : pointshop.voucherType.description,
    };
    return res.status(200).json({ getPointShops: getPointShops });
  } catch (err) {
    console.error("Error when finding point shop item info");
    console.error(err);
    return res.status(400).json({ error: "Internal Error" });
  }
});

// add to cart
// rewards/items
router.post("/cart/create", authorizeMw, async (req, res) => {
  const { categoryId, qty, name } = req.body;

  try {
    const foundUser = req.currentUser.data;
    const currentCart = await Cart.findOne({
      where: { userId: foundUser.id, categoryId, checked: true },
    });
    if (currentCart) {
      currentCart.qty += qty;
      await currentCart.save();
      return res.status(200).json({ message: "Updated Successfully." });
    } else {
      const savedCart = Cart.build({
        userId: foundUser.id,
        categoryId: categoryId,
        qty,
        name,
      });

      await savedCart.save();
      return res.status(200).json({ message: "Added Successfully." });
    }
  } catch (err) {
    console.error("Error when finding address info");
    console.error(err);
    return res.status(400).json({ error: "Internal Error" });
  }
});

// cartInfo
router.post("/cart/fetch", authorizeMw, async (req, res) => {
  const items = [];
  try {
    const foundUser = req.currentUser.data;
    const pointshop = await Cart.findAll({
      where: {
        userId: foundUser.id,
      },
      include: [
        {
          model: Category,
          include: [{ model: VoucherType }, { model: Product }],
        },
      ],
    });

    for (let p = 0; p < pointshop.length; p++) {
      items.push({
        image: `https://test-2023.s3.ap-southeast-1.amazonaws.com/${
          pointshop[p].category.product
            ? pointshop[p].category.product.itemImage
            : pointshop[p].category.voucherType.voucherImage
        }`,
        categoryId: pointshop[p].categoryId,
        id: pointshop[p].id,
        qty: pointshop[p].qty,
        name: pointshop[p].category.product
          ? pointshop[p].category.product.itemName
          : pointshop[p].category.voucherType.name,
        points: pointshop[p].category.product
          ? pointshop[p].category.product.points
          : pointshop[p].category.voucherType.points,
        categoryName: pointshop[p].category.name,
        pickup_optional: pointshop[p].category.product
          ? pointshop[p].category.product.pickup_optional
          : "Not Applicable",
        checked: pointshop[p].checked,
      });
    }

    return (
      res
        .status(200)
          .json({ items: items })
    );
  } catch (err) {
    console.error("Error when finding address info");
    console.error(err);
    return res.status(400).json({ error: "Internal Error" });
  }
});

// cartInfo
router.post("/cart/set", authorizeMw, async (req, res) => {
  const { id, action } = req.body;
  if (!id || !action) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const foundUser = req.currentUser.data;
    const foundData = await Cart.findOne({
      where: {
        userId: foundUser.id,
        id,
      },
    });
    if (!foundData) {
      return res.status(400).json({ error: "Error Update" });
    }
    if (action === "delete") {
      await Cart.destroy({ where: { id: foundData.id } });
    } else if (action === "deduct") {
      foundData.qty--;
      if (foundData.qty < 1) {
        foundData.qty = 1;
        return foundData;
      }
      await foundData.save();
    } else if (action === "add") {
      foundData.qty++;
      if (foundData.qty < 1) {
        foundData.qty = 1;
        return foundData;
      }
      await foundData.save();
    } else if (action === "unchecked") {
      foundData.checked = false;
      await foundData.save();
    } else if (action === "checked") {
      foundData.checked = true;
      await foundData.save();
    }

    return res.status(200).json({ message: "Updated Successfully." });
  } catch (err) {
    console.error("Error when updating cart info");
    console.error(err);
    return res.status(400).json({ error: "Internal Error" });
  }
});

// checkout
router.post("/order/create", authorizeMw, async (req, res) => {
  const { addressId, deliveryOption, collectStoreId } = req.body;

  const foundUser = req.currentUser.data;
  const currUserPoint = await getTotalEarn(foundUser.id);

  const foundAddress = await Address.findOne({
    where: {
      id: addressId,
    },
  });

  const carts = await Cart.findAll({
    where: { userId: foundUser.id, checked: true },
    include: [
      {
        model: Category,
        include: [
          { model: VoucherType },
          { model: Product, include: { model: Inventory } },
        ],
      },
    ],
  });


  try {
    let redeemPoints = 0;
    const redeemItems = [];
    const voucherItems = [];
    for (let i = 0; i < carts.length; i++) {
      const item = carts[i];

      if (item.category.product) {

        if (!foundAddress) {
          return res.status(400).json({ error: "Address not found" });
        }
        const totalBalance = item.category.product.totalBalance;
        const currentStock = item.category.product.inventory;
        const used = currentStock ? currentStock.usedCount : 0;
        const balanceStock = totalBalance - used - item.qty;

        if (!item.category.product.active) {
          return res
            .status(400)
            .json({ error: `Item (${item.name}) not available` });
        }
        if (balanceStock < 0) {
          return res
            .status(400)
            .json({ error: `Item (${item.name}) stock not available` });
        }
        redeemPoints += item.category.product.points * item.qty;
        redeemItems.push({ id: item.category.product.id, qty: item.qty });
      }

      if (item.category.voucherType) {
        const currentStock = await Voucher.findAll({
          where: {
            shopper: false,
            voucherTypeId: item.category.voucherType.dataValues.id,
            redeemed: false,
          },
        });
        const balanceStock = currentStock.length - item.qty;
        if (!item.category.voucherType.active) {
          return res
            .status(400)
            .json({ error: `Voucher (${item.name}) not available` });
        }
        if (balanceStock < 0) {
          return res
            .status(400)
            .json({ error: `Voucher (${item.name}) stock not available` });
        }
        redeemPoints += item.category.voucherType.points * item.qty;
        voucherItems.push({ id: item.category.voucherType.id, qty: item.qty });
      }
    }
    if (currUserPoint < redeemPoints) {
      return res.status(400).json({ error: "Insufficient redeem points!" });
    }
    // everything passed
    // create new order
    genNewTrackingNum("psTracking", (err, trackingId) => {
      if (err) {
        return res
          .status(400)
          .json({ error: "Error on getting the tracking number" });
      }
      const type = "REDEMPTION";
      const street = `${foundAddress?.line1} ${
        foundAddress?.line2 ? foundAddress?.line2 : ""
      }`;

      const orderObj = {
        WebCustomerNumber: foundUser.email,
        WebOrderNumber: trackingId,
        Name: foundAddress?.name,
        Street: street,
        Postcode: foundAddress?.postcode,
        City: foundAddress?.city,
        Site: "Test",
        type,
        itemList: redeemItems.length,
        deliveryOption,
      };
      // place order to delivery
      placeOrder(orderObj, async (err) => {
        if (err) {
          return res
            .status(400)
            .json({ error: "Error Create order in tracking more" });
        }

        // success
        const newOrder = Order.build({
          trackingId,
          type,
          userId: foundUser.id,
          deliveryOption,
          retailerId: collectStoreId,
          name: foundAddress?.name,
          number: foundAddress?.number,
          line1: foundAddress?.line1,
          line2: foundAddress?.line2,
          city: foundAddress?.city,
          postcode: foundAddress?.postcode,
        });


        const savedOrder = await newOrder.save();

        const newOrderItems = carts.map((item) => ({
          quantity: item.qty,
          userId: foundUser.id,
          orderId: savedOrder.id,
          name: item.category.product
            ? item.category.product.itemName
            : item.category.voucherType.name,
          point: item.category.product
            ? item.category.product.points
            : item.category.voucherType.points,
          productId: item.category.product
            ? item.category.product.id 
            : null,
          voucherTypeId: item.category.voucherType 
            ? item.category.voucherType.id 
            : null,
        }));


        const savedOrderItems = OrderItems.bulkCreate(newOrderItems);
        const callPoint = await giveUserPoint({
          source: "ORDER",
          points: parseFloat(-redeemPoints),
          sourceId: savedOrder.id,
          userId: foundUser.id,
        });
        if (callPoint) {
          for (let o = 0; o < redeemItems.length; o++) {
            const foundInventory = await Inventory.findOne({
              where: { productId: redeemItems[o].id },
            });
            if (!foundInventory) {
              return res.status(400).json({ error: "Inventory not found" });
            }
            foundInventory.usedCount += redeemItems[o].qty;
            await foundInventory.save();
          }
          for (let v = 0; v < voucherItems.length; v++) {
            const foundVoucher = await Voucher.findOne({
              where: { voucherTypeId: voucherItems[v].id },
            });
            if (!foundVoucher) {
              return res.status(400).json({ error: "Voucher not found" });
            }
            foundVoucher.userId = foundUser.id;
            foundVoucher.redeemed = true;
            await foundVoucher.save();
          }
          const orderData = {
            id: savedOrder.id,
            type: savedOrder.type,
            trackingId: savedOrder.trackingId,
            orderItems: carts
          };


          await Cart.destroy({
            where: { userId: foundUser.id, checked: true },
          });

          return res.status(200).json({
            message: "Created Successfully.",
            orderData,
            orderObj,
            savedOrderItems,
          });
        } else {
          return res.status(400).json({ error: "Error in giving user point" });
        }
      });
    });
  } catch (err) {
    console.error("Error in create order");
    console.error(err);
    return res.status(400).json({ error: "Error create order" });
  }
});

router.post("/rating/create", authorizeMw, async (req, res) => {
  const { rating, review, productId, trackingId } = req.body;

  try {
    const foundUser = req.currentUser.data;
    const foundRating = await Rating.findOne({
      where: {
        userId: foundUser.id,
        productId: productId,
        trackingId: trackingId,
      },
    });
     const foundProduct = await Product.findAll({
       include: [{ model: Category }],
    });

    if (!foundProduct) {
      return res.status(400).json({ error: "Product not found." });
    }

    if (foundRating) {
      return res
        .status(400)
        .json({ error: "You have submitted rating before." });
    } else {
      const savedRating = Rating.build({
        userId: foundUser.id,
        productId,
        rating,
        review,
        trackingId,
        status: "PENDING",
      });

      await savedRating.save();
      return res.status(200).json({ message: "Added User Rating & review." });
    }
  } catch (err) {
    console.error("Error when finding rating");
    console.error(err);
    return res.status(400).json({ error: "Internal Error" });
  }
});


// fetch rating for the product
router.post("/rating/fetch", authorizeMw, async (req, res) => {
  const foundUser = req.currentUser.data;

  try {
    const foundRating = await Rating.findAll({
      where: { status: "APPROVED" },
      include: [{ model: Product }, { model: User }],
    });
    const foundAllRatings = await Rating.findAll({
      where: { userId: foundUser.id },
    });

    return res
      .status(200)
      .json({ foundRating: foundRating, foundAllRatings: foundAllRatings });
  } catch (err) {
    console.error("Error when finding rating");
    console.error(err);
    return res.status(400).json({ error: "Internal Error" });
  }
});

module.exports = router;
