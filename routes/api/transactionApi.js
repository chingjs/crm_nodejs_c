require('dotenv').config();
const express = require('express');
const { Op } = require('sequelize');
const AWS = require('aws-sdk');

const { authorizeMw } = require('../../config/middlewares/authorize');
//Transaction
const Transaction = require('../../config/tables/transaction/Transaction');
const Receipt = require('../../config/tables/transaction/Receipt');

//Store
const Retailer = require('../../config/tables/store/Retailer');
const router = express.Router();
const { s3Upload } = require('../../config/functions/aws');
const Point = require('../../config/tables/user/Point');
const { generateCode } = require('../../config/functions/misc');
const User = require('../../config/tables/user/User');
const s3 = new AWS.S3();

router.post('/receipt/upload', authorizeMw, async (req, res) => {
	const { sendData } = req.body;
	const foundUser = req.currentUser.data;
	const { storeId, rewardsType, resubmitTranId } = JSON.parse(sendData);
	const receipt = req.files && req.files.image ? req.files.image : null;

	// ADDED by yt
	const today = new Date(); // 2023-09-11T02:24:05.700Z
	const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 2); // 2023-09-01T16:00:00.000Z
	const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1); // 2023-09-30T16:00:00.000Z

	if (!receipt) {
		return res.status(400).json({ error: 'Missing Details' });
	}

	try {
		if (storeId) {
			const storeCheck = await Retailer.findOne({ where: { id: storeId } });
			if (!storeCheck) {
				return res.status(400).json({ error: 'Store not found' });
			}
		}

		if (!receipt) {
			return res.status(400).json({ error: 'Receipt image not found' });
		}

		const receiptParam = {
			Bucket: process.env.BUCKETNAME,
			Key: `${process.env.S3TYPE}/receipt/${foundUser.id}/${generateCode(6)}`,
			Body: receipt.data,
			ContentType: receipt.mimetype,
		};

		const upload = await s3Upload(receiptParam);

		if (!upload) {
			return res.status(400).json({ error: 'Error uploading receipt' });
		}

		const receiptCount = await Transaction.count({
			where: {
				userId: foundUser.id,
				status: {
					[Op.or]: ['PENDING', 'APPROVED'],
				},
				createdAt: {
					[Op.between]: [startOfMonth, endOfMonth],
				},
			},
		});

		if (receiptCount < 3 && !rewardsType) {
			return res
				.status(400)
				.json({ error: 'User did not select any rewards type' });
		}

		const newTransaction = Transaction.build({
			status: 'PENDING',
			sales: 0,
			active: true,
			userId: foundUser.id,
			retailerId: storeId,
			rewardType: receiptCount < 3 ? rewardsType : null,
		});

		const savedTransaction = await newTransaction.save();
		const s3 = new AWS.S3();
		const getParam = {
			Bucket: receiptParam.Bucket,
			Key: receiptParam.Key,
			Expires: 86400,
		};

		const newUrl = await Promise.resolve(
			s3.getSignedUrlPromise('getObject', getParam)
		);

		const newReceipt = Receipt.build({
			amount: 0,
			invoice_No: '',
			transactionId: savedTransaction.id,
			url: newUrl,
			image_key: receiptParam.Key,
		});

		await newReceipt.save();

		if (resubmitTranId) {
			const findResubmit = await Transaction.findOne({
				where: { id: resubmitTranId },
			});

			if (findResubmit) {
				console.log('found resubmit record');
				findResubmit.active = false;
				await findResubmit.save();
				console.log(resubmitTranId);

				return res.status(200).json({ data: 'voucher update success' });
			}
		}
		return res.status(200).json({ message: 'success' });
	} catch (error) {
		console.log('ERROR WHEN USER UPLOAD RECEIPT', error);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/history/fetch', authorizeMw, async (req, res) => {
	const { value } = req.body;

	const filterDate = value.value;
	const today = new Date();
	const overview = new Date(today.getFullYear());
	const lastMonth = new Date(
		today.getFullYear(),
		today.getMonth() - 1,
		today.getDate()
	);
	const lastThreeMonths = new Date(
		today.getFullYear(),
		today.getMonth() - 3,
		today.getDate()
	);
	const lastSixMonths = new Date(
		today.getFullYear(),
		today.getMonth() - 6,
		today.getDate()
	);
	const foundUser = req.currentUser.data;

	let trans = [];
	let points = [];
	let query = { order: [['createdAt', 'DESC']], include: Receipt };
	let queryPoint = { order: [['createdAt', 'DESC']] };

	if (filterDate === 'overview') {
		query.where = {
			userId: foundUser.id,
			createdAt: {
				[Op.between]: [overview, today],
			},
		};
	} else if (filterDate === 'last_month') {
		query.where = {
			userId: foundUser.id,
			createdAt: {
				[Op.between]: [lastMonth, today],
			},
		};
	} else if (filterDate === 'last_three_months') {
		query.where = {
			userId: foundUser.id,
			createdAt: {
				[Op.between]: [lastThreeMonths, today],
			},
		};
	} else {
		query.where = {
			userId: foundUser.id,
			createdAt: {
				[Op.between]: [lastSixMonths, today],
			},
		};
	}

	if (filterDate === 'overview') {
		queryPoint.where = {
			userId: foundUser.id,
			createdAt: {
				[Op.between]: [overview, today],
			},
		};
	} else if (filterDate === 'last_month') {
		queryPoint.where = {
			userId: foundUser.id,
			createdAt: {
				[Op.between]: [lastMonth, today],
			},
		};
	} else if (filterDate === 'last_three_months') {
		queryPoint.where = {
			userId: foundUser.id,
			createdAt: {
				[Op.between]: [lastThreeMonths, today],
			},
		};
	} else {
		queryPoint.where = {
			userId: foundUser.id,
			createdAt: {
				[Op.between]: [lastSixMonths, today],
			},
		};
	}

	try {
		const checkTransaction = await Transaction.findAll(query);

		for (let t = 0; t < checkTransaction.length; t++) {
			let tran = checkTransaction[t];
			if (tran) {
				const image = tran.dataValues.receipts[0].dataValues.image_key;
				const param = {
					Bucket: process.env.BUCKETNAME,
					Key: image,
					Expires: 86400,
				};
				const receiptImage = await Promise.resolve(
					s3.getSignedUrlPromise('getObject', param)
				);
				trans.push({ ...tran.dataValues, imageurl: receiptImage });
			}
		}
		const checkPoint = await Point.findAll(queryPoint);
		for (let p = 0; p < checkPoint.length; p++) {
			if (checkPoint[p].source === 'UPLOAD') {
				let ptran = checkPoint[p].sourceId;
				const receipt = await Receipt.findOne({
					where: { transactionId: ptran },
				});
				if (receipt) {
					const image = receipt.image_key;
					const param = {
						Bucket: process.env.BUCKETNAME,
						Key: image,
						Expires: 86400,
					};

					const receiptImage = await Promise.resolve(
						s3.getSignedUrlPromise('getObject', param)
					);
					points.push({
						...checkPoint[p].dataValues,
						imageurl: receiptImage,
						receipt: receipt,
					});
				}
			} else {
				points.push({ ...checkPoint[p].dataValues });
			}
		}

		// return res.status(200).json({ data: { trans, points } });
		return res.status(200).json({ uploadHistory: trans, pointHistory: points });
	} catch (err) {
		console.error('Error when finding order info');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

module.exports = router;