require("dotenv").config();
const express = require("express");
const AWS = require("aws-sdk");
const { authorizeMwAdmin } = require("../../config/middlewares/authorize");
const Retailer = require("../../config/tables/store/Retailer");
const Receipt = require("../../config/tables/transaction/Receipt");
const Item = require("../../config/tables/transaction/Item");
const Sku = require("../../config/tables/settings/Sku");
const { sqlDate } = require("../../config/functions/misc");
const sequelize = require("../../config/sequelize");
const router = express.Router();
const s3 = new AWS.S3();

router.post("/validationList", authorizeMwAdmin, async (req, res) => {
  const { startDate, endDate, status } = req.body;
  let queryStatus = status ? `AND  tran.status = ${status}` : "";
  var stDate = startDate ? sqlDate(startDate) : sqlDate("2023-5-1");
  var edDate = endDate ? sqlDate(endDate) : sqlDate();

  const [result] = await sequelize.query(`
  SELECT
  tran.id,
  tran.id as key,
  tran.status,
  tran.sales,
  tran.transaction_date,
  tran.reason,
  tran.promo,
  tran."rewardType",
  tran."createdAt",
  tran.validator_name,
  tran.validator_id,
  tran.validated_date,
  usr.id AS "usrid",
  usr.name AS "name",
  usr.number AS "number",
  rc.image_key AS "image_key",
  rc.receipt_date AS "receipt_date",
  rc."invoice_No" AS "invoice_No",
  rc.url AS "url",
  rc.expired AS "expired",
  store.name AS "storename",
  store.state AS "state",
  i.quantity AS "quantity",
  i."skuId" AS "skuId",
  i.price AS "price",
  SUM(point.points) AS "points"
  FROM
  "transaction" AS tran
  INNER JOIN
  "user"  AS usr ON tran."userId" = usr.id
  INNER JOIN
  receipt AS rc ON tran.id = rc."transactionId"
  INNER JOIN
  point AS point ON tran.id = point."sourceId"::integer
  AND point."source" = 'UPLOAD'
  LEFT JOIN
  retailer AS store ON tran."retailerId" = store.id
  LEFT JOIN
  item AS i ON tran.id = i."transactionId"
 WHERE 
  tran."createdAt" BETWEEN '${stDate} 00:00' AND '${edDate} 23:59' 
  ${queryStatus}
  GROUP BY
  tran.id,
  usr.id,
  i.id,
  usr.name,
  usr.number,
  rc.id,
  store.id
  ORDER BY
  tran."createdAt" ASC
`);
  
  let newResult = await Promise.all(
    result.map(async (data) => {
      const param = {
        Bucket: process.env.BUCKETNAME,
        Key: data.image_key,
        Expires: 86400,
      };
      let today = new Date();
      let checkDate = data.expired;
      if (today > checkDate || !data.url || !data.expired) {
        const receiptImage = await s3.getSignedUrlPromise("getObject", param);
        const updateReceipt = await Receipt.findOne({
          where: { id: data.id },
        });

        if (updateReceipt) {
          updateReceipt.url = receiptImage;
          updateReceipt.expired = today.setDate(today.getDate() + 1);
          await updateReceipt.save();
          data.receiptImage = receiptImage;
        }
      } else {
        data.receiptImage = data.url;
      }
      const items = await Item.findAll({
        where: { transactionId: data.id },
        include: { model: Sku },
      });

      data.skuData = items.map((m) => {
        return {
          quantity: m.quantity,
          price: m.price,
          name: m.sku.name,
        };
      });
      return data;
    })
  );

  const stores = await Retailer.findAll({});
  const uniquestore = [...new Set(stores.map((store) => store.name))];
  const sku = await Sku.findAll({});
  const mapSku = sku.map((data) => ({
    label: data.name,
    value: data.name,
  }));
  return res
    .status(200)
    .json({ data: newResult, storeList: uniquestore, skuList: mapSku });
});

router.post("/transaction/fetch", authorizeMwAdmin, async (req, res) => {
  const { startDate, endDate } = req.body;

  var stDate = startDate ? sqlDate(startDate) : sqlDate("2023-8-1");
  var edDate = endDate ? sqlDate(endDate) : sqlDate();

  try {
    const [result] = await sequelize.query(`
    SELECT
      o."trackingId" AS trackingid,
      o.id AS key,
      o.id AS orderId, 
      u.id,
      u.name,
      u.email, 
      o."createdAt",
      o.status,
      o.remark,
      (SELECT SUM(CAST(d.point AS INT)) FROM public."orderItems" AS d WHERE d."orderId" = o.id) AS point,
      o.name AS addressname,
      o.line1 AS line1,
      o.line2 AS line2,
      o.postcode AS postcode,
      o.city AS city,
      o.number AS number,
      /* STRING_AGG is use concatenated when user has more than one item under the same trackingId */
      (SELECT STRING_AGG(d."name", ', ') FROM public."orderItems" AS d WHERE d."orderId" = o.id) AS itemName
    FROM
      "order" AS o
    JOIN
      "user" AS u ON o."userId" = u.id
      WHERE 
      o."createdAt" BETWEEN '${stDate} 00:00' AND '${edDate} 23:59' 
    GROUP BY
      o."trackingId",
      o.id, 
      u.id
    ORDER BY
      o."trackingId" DESC;
    `);

    return res.status(200).json({ data: result });
  } catch (err) {
    console.error("Error when finding all brands for user setting");
    console.error(err);
    return res.status(400).json({ error: "Internal Error" });
  }
});


router.post("/store", authorizeMwAdmin, async (req, res) => {
	const { startDate, endDate } = req.body;

	var stDate = startDate ? sqlDate(startDate) : sqlDate("2023-8-1");
	var edDate = endDate ? sqlDate(endDate) : sqlDate();

	try {
		const [result] = await sequelize.query(`
SELECT R.ID AS "storeId",
	R."code" AS "code",
	R.NAME,
	R.STORE_TYPE AS "type",
	R.STORE_GROUP AS "channel",
	R.STATE,
	SUM(RECEIPT.AMOUNT) AS "totalSalesAmount",
	SUM(ITEM.quantity) AS "totalSoldUnit"
FROM RETAILER AS R
LEFT JOIN TRANSACTION AS T ON R.ID = T."retailerId"
LEFT JOIN ITEM ON ITEM."transactionId" = T."id"
LEFT JOIN RECEIPT ON T."id" = RECEIPT."transactionId"
WHERE R."createdAt" BETWEEN '${stDate} 00:00' AND '${edDate} 23:59' 
GROUP BY R.ID,
	R."code",
	R.NAME,
	R.STORE_TYPE,
	R.STORE_GROUP,
	R.STATE,
	R."createdAt"
ORDER BY R."createdAt" DESC;
    `);

		return res.status(200).json({ data: result });
	} catch (err) {
		console.error("Error when finding all brands for user setting");
		console.error(err);
		return res.status(400).json({ error: "Internal Error" });
	}
});


router.post("/pointhistory/fetch", authorizeMwAdmin, async (req, res) => {
  const { startDate, endDate } = req.body;
  var stDate = startDate ? sqlDate(startDate) : sqlDate("2023-5-1");
  var edDate = endDate ? sqlDate(endDate) : sqlDate();

  try {
    const [result] = await sequelize.query(`
    SELECT
    u.id,
    u.id as key,
    u.name,
    SUM(p.points) AS balance
    FROM
    public.user AS u
    JOIN
    public.point AS p ON p."userId" = u.id
    WHERE
    p."createdAt" BETWEEN '${stDate} 00:00' AND '${edDate} 23:59'  
    GROUP BY
    u.id, u.name;
	  `);

    return res.status(200).json({ data: result });
  } catch (err) {
    console.error("Error when finding all brands for user setting");
    console.error(err);
    return res.status(400).json({ error: "Internal Error" });
  }
});

router.post("/account/fetch", authorizeMwAdmin, async (req, res) => {
  const { startDate, endDate } = req.body;
  var stDate = startDate ? sqlDate(startDate) : sqlDate("2023-3-1");
  var edDate = endDate ? sqlDate(endDate) : sqlDate();

  try {
		const [result] = await sequelize.query(`
SELECT
    u.id,
    u.id as key,
    u.name,
    u.dob,
    u.email,
    u.number,
    u."tierStatus",
    u."referralCode",
    u."referBy",
    u.verified,
    u."createdAt",
    COALESCE(trx."transaction_count", 0) AS "totalSubmissions",
    SUM(CASE WHEN p.points > 0 THEN p.points ELSE 0 END) AS "totalEarnPoint",
    SUM(p.points) AS "pointBalance",
    ABS(SUM(CASE WHEN p.points < 0 THEN p.points ELSE 0 END)) AS "usedPoint",
    MAX(sku.preferedBrand) AS "preferedBrand",
    COALESCE(SUM(purchase_stats.quantity_sum), 0) AS "totalPurchaseQty",
    COALESCE(SUM(purchase_stats.price_sum), 0) AS "totalPurchasedAmount"
FROM
    public.user AS u
LEFT JOIN
    point AS p ON u.id = p."userId"
LEFT JOIN (
    SELECT
        t."userId",
        COUNT(*) AS transaction_count
    FROM
        "transaction" AS t
    GROUP BY
        t."userId"
) AS trx ON u.id = trx."userId"
LEFT JOIN (
    SELECT
        t."userId",
        MAX(s."brand") AS preferedBrand
    FROM
        "transaction" AS t
    JOIN
        item AS i ON t.id = i."transactionId"
    JOIN
        sku AS s ON i."skuId" = s.id
    GROUP BY
        t."userId"
) AS sku ON u.id = sku."userId"
LEFT JOIN (
    SELECT
        t."userId",
        SUM(i.quantity) AS quantity_sum,
        SUM(i.price) AS price_sum
    FROM
        "transaction" AS t
    JOIN
        item AS i ON t.id = i."transactionId"
    GROUP BY
        t."userId"
) AS purchase_stats ON u.id = purchase_stats."userId"
WHERE
    u."createdAt" BETWEEN '${stDate} 00:00' AND '${edDate} 23:59'
GROUP BY
    u.id,
    u.name,
    u.dob,
    u.email,
    u.number,
    u."tierStatus",
    u."referralCode",
    u."referBy",
    u.verified,
    u."createdAt",
    trx."transaction_count"
ORDER BY
    u.id DESC;

    `);

		return res.status(200).json({ data: result });
	} catch (err) {
		console.error("Error when finding all brands for user setting");
		console.error(err);
	}
});

router.post("/rating/fetch", authorizeMwAdmin, async (req, res) => {
  const { startDate, endDate } = req.body;
  var stDate = startDate ? sqlDate(startDate) : sqlDate("2023-3-1");
  var edDate = endDate ? sqlDate(endDate) : sqlDate();

  try {
    const [result] = await sequelize.query(`
    SELECT
    r.id,r.id as key,r."userId",r."productId",r.review,r.status,r.rating,r."createdAt" 
    FROM public.rating as r, public.user as u
    WHERE r."userId" = u.id
    AND r."createdAt" BETWEEN '${stDate} 00:00' AND '${edDate} 23:59'  
    ORDER BY r.id DESC
    `);

    return res.status(200).json({ data: result });
  } catch (err) {
    console.error("Error when finding all brands for user setting");
    console.error(err);
    return res.status(400).json({ error: "Internal Error" });
  }
});

module.exports = router;
