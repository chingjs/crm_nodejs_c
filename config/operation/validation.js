const { Op } = require("sequelize");
const moment = require("moment");
const sequelize = require("../sequelize.js");
const Transaction = require("../tables/transaction/Transaction");
const User = require("../tables/user/User.js");
const Receipt = require("../tables/transaction/Receipt");
const Retailer = require("../tables/store/Retailer");
const Item = require("../tables/transaction/Item");

const validationList = async (startDate, endDate, status) => {
  const data = [];
  if (startDate && endDate) {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);
    query.transaction_date = { [Op.between]: [start, end] };
  }
  try {
    const transactions = await Transaction.findAll({
      where: query,
      attributes: [
        "id",
        "status",
        "sales",
        "transaction_date",
        "reason",
        "promo",
        "rewardType",
        "createdAt",
        "validator_name",
        "validator_id",
        "validated_date",
        [sequelize.fn("SUM", sequelize.col("items.price")), "receipt_amount"],
      ],
      group: [
        "receipts.id",
        "user.id",
        "user.name",
        "user.number",
        "transaction.id",
        "items.id",
        "retailer.id",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "number"],
        },
        {
          model: Receipt,
          as: "receipts",
          attributes: [
            "image_key",
            "receipt_date",
            "invoice_No",
            "url",
            "expired",
          ],
        },
        {
          model: Retailer,
          as: "retailer",
          attributes: ["name", "state"],
        },
        {
          model: Item,
          as: "items",
          attributes: ["quantity", "skuId", "price"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });
    transactions.map(async (e) => {
      let itemSKU = [];
      let skuArray = [];
      let voucher = null;

      let newTotal = 0;
      const temp = {
        id: e.id,
        status: e.status,
        receiptDate: e.receipts[0]
          ? moment(e.receipts[0].receipt_date).format("DD/MM/YYYY")
          : "NA",
        uploadDate: moment(new Date(e.createdAt)).format("DD/MM/YYYY"),
        name: e.user.name,
        number: e.user.number,
        storeName: e.retailer?.name,
        state: e.retailer?.state,
        invoice_No: e.receipts[0] ? e.receipts[0].invoice_No : "NA",
        sales: newTotal ? newTotal : e.sales.toFixed(2),
        skuArray,
        joinSKU: itemSKU.join(`\n`),
        receiptKey: e.receipts[0].image_key,
        expired: e.receipts[0].expired,
        url: e.receipts[0].url,
        promo: e.promo ? "YES" : "NO",
        reason: e.reason,
        category: e.category,
        rewardType: e.rewardType,
        voucherCode: voucher && voucher.code,
        tngPrice: voucher ? voucher.amount : "",
        doneBY: e.validator_name,
        totalSold:
          skuArray && skuArray.length
            ? skuArray.map((r) => r.quantity).reduce((o, p) => o + p, 0)
            : "",
        actionDate: e.validated_date
          ? moment(e.validated_date).format("YYYY-MM-DD")
          : "NA",
        actionTime: e.validated_date
          ? moment(e.validated_date).format("hh:mm:ss")
          : "NA",
        skuData: [],
      };
      data.push(temp);
    });
    return data;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  validationList,
};
