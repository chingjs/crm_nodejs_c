require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const AWS = require('aws-sdk');
const User = require('../../config/tables/user/User');
const Product = require('../../config/tables/settings/item/Product');
const Category = require('../../config/tables/settings/item/Category');
const CategoryChoice = require('../../config/tables/settings/CategoryChoice');
const Inventory = require('../../config/tables/settings/Inventory');
const Voucher = require('../../config/tables/settings/voucher/Voucher');
const VoucherType = require('../../config/tables/settings/voucher/VoucherType');
const VoucherBatch = require('../../config/tables/settings/voucher/VoucherBatch');
const Item = require('../../config/tables/transaction/Item');
const Sku = require('../../config/tables/settings/Sku');
const Transaction = require('../../config/tables/transaction/Transaction');
const Receipt = require('../../config/tables/transaction/Receipt');
const Retailer = require('../../config/tables/store/Retailer');
const Point = require('../../config/tables/user/Point');
const Order = require('../../config/tables/transaction/Order');
const Rating = require('../../config/tables/settings/Rating');
const Admin = require('../../config/tables/admin/Admin');
const { makeid } = require('../../config/functions/misc');
const { s3Upload } = require('../../config/functions/aws');
const { authorizeMwAdmin } = require('../../config/middlewares/authorize');
const {
	checkUpgradeTier,
	pointMultiplication,
	giveUserPoint,
} = require('../../config/functions/helperFunctions');
const moment = require('moment');
const Articles = require('../../config/tables/misc/Articles');
const router = express.Router();
const s3 = new AWS.S3();
const Bucket = process.env.BUCKETNAME;
const sequelize = require('../../config/sequelize');
const Claim = require('../../config/tables/store/Claim');

router.post('/user/login', async (req, res) => {
	const { username, password } = req.body;
	try {
		const foundAdmin = await Admin.findOne({ where: { username } });

		if (!foundAdmin) {
			return res.status(400).json({
				error: 'Username not exist in system.',
			});
		} else {
			const result = await bcrypt.compare(password, foundAdmin.password);
			if (!result)
				return res
					.status(400)
					.json({ error: 'You\'ve entered the wrong password' });

			try {
				jwt.sign(
					{ id: foundAdmin.id },
					process.env.JWT_SECRET,
					{ expiresIn: '12h' },
					(err, token) => {
						if (err) {
							console.error('Error when signing admin token in admin login');
							console.error(err);
							return res.status(400).json({ error: 'Token Error' });
						} else {
							return res.status(200).json({ token });
						}
					}
				);
			} catch (err) {
				console.error('Error when signing admin token in admin login');
				console.error(err);
				return res.status(400).json({ error: 'Internal Error' });
			}
		}
	} catch (err) {
		console.error('Error when finding Customer in Customer login');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/product/fetch', authorizeMwAdmin, async (req, res) => {
	const dataList = [];
	try {
		const categories = await CategoryChoice.findAll({
			where: { name: { [Op.ne]: 'VOUCHER' } },
		});
		const [result] = await sequelize.query(`
    SELECT
    p.*,
    p.id as key,
    c.name AS category_name,
    c.*
    FROM
    product AS p
    JOIN
    category AS c ON c."productId" = p.id
    WHERE
    c.name != 'Voucher'`);

		return res.status(200).json({ data: result, categoryList: categories });
	} catch (err) {
		console.error('Error when finding all items');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/product/create', authorizeMwAdmin, async (req, res) => {
	const { sendData } = req.body;
	const data = JSON.parse(sendData);

	const foundProduct = await Product.findOne({
		where: { productId: data.productId, itemName: data.itemName },
	});
	if (foundProduct) {
		return res.status(400).json({ error: 'Item details existed.' });
	}
	try {
		if (req.files && req.files.file && req.files.file2 && req.files.file3) {
			const ContentType = req.files.file.mimetype;
			const ContentTypeBM = req.files.file2.mimetype;
			const ContentTypeCH = req.files.file3.mimetype;
			const Key = `${process.env.S3TYPE}/public/settings/products/eng/${makeid(
				8
			)}`;
			const KeyBM = `${process.env.S3TYPE}/public/settings/products/bm/${makeid(
				8
			)}`;
			const KeyCH = `${process.env.S3TYPE}/public/settings/products/ch/${makeid(
				8
			)}`;
			const param = {
				Bucket,
				Key: Key,
				Body: req.files.file.data,
				ContentType: ContentType,
			};
			const paramBM = {
				Bucket,
				Key: KeyBM,
				Body: req.files.file2.data,
				ContentType: ContentTypeBM,
			};
			const paramCH = {
				Bucket,
				Key: KeyCH,
				Body: req.files.file3.data,
				ContentType: ContentTypeCH,
			};
			const uploadENG = await s3Upload(param);
			const uploadBM = await s3Upload(paramBM);
			const uploadCH = await s3Upload(paramCH);
			// console.log("checkImg", uploadENG,uploadBM, uploadCH);
			if (!uploadENG || !uploadBM || !uploadCH) {
				return res.status(400).json({ error: 'Error uploading image ' });
			}

			const newProduct = Product.build({
				productId: data.productId,
				itemName: data.itemName,
				uom: data.uom,
				description: data.description,
				points: data.points,
				itemImage: Key,
				totalBalance: data.totalBalance,
				active: true,
				bmName: data.bmName,
				bmDescription: data.bmDescription,
				bmItemImage: KeyBM,
				chName: data.chName,
				chDescription: data.chDescription,
				chItemImage: KeyCH,
				pickup_optional: data.pickup_optional,
				filter_by: data.filter_by,
			});

			const savedProduct = await newProduct.save();
			if (savedProduct) {
				const newInventory = Inventory.build({
					type: 'PS',
					productId: savedProduct.id,
					usedCount: 0,
				});
				await newInventory.save();
			} else {
				return res.status(400).json({ error: 'Failed to Create Inventory' });
			}
			for (let c = 0; c < data.category.length; c++) {
				await Category.bulkCreate([
					{
						name: 'itemCategory',
						productId: savedProduct.id,
						categoryChoiceId: data.category[c],
					},
				]);
			}
			return res.status(200).json({ message: 'Created Success' });
		} else {
			return res.status(400).json({ error: 'Missing files' });
		}
	} catch (err) {
		console.error('Error when finding all ps for admin');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/product/update', authorizeMwAdmin, async (req, res) => {
	const { sendData } = req.body;
	const data = JSON.parse(sendData);
	const foundProduct = await Product.findOne({
		where: { id: data.key },
	});
	if (!foundProduct) {
		return res.status(400).json({ error: 'Product not found.' });
	}
	try {
		if (req.files && req.files.file) {
			const ContentType = req.files.file.mimetype;
			const Key = data.key;
			const param = {
				Bucket,
				Key: Key,
				Body: req.files.file.data,
				ContentType: ContentType,
			};
			const upload = await s3Upload(param);
			if (!upload) {
				console.error('Error when uploading item image to s3');
				return res
					.status(400)
					.json({ error: 'Error when uploading ENG item image to S3' });
			}
		}
		if (req.files && req.files.file2) {
			const ContentType = req.files.file2.mimetype;
			const KeyBM = data.keyBM;
			const paramBM = {
				Bucket,
				Key: KeyBM,
				Body: req.files.file2.data,
				ContentType: ContentType,
			};
			const upload = await s3Upload(paramBM);
			if (!upload) {
				console.error('Error when uploading item image to s3');
				return res
					.status(400)
					.json({ error: 'Error when uploading BM item image to S3' });
			}
		}
		if (req.files && req.files.file3) {
			const ContentType = req.files.file3.mimetype;
			const KeyCH = data.keyCH;
			const paramCH = {
				Bucket,
				Key: KeyCH,
				Body: req.files.file3.data,
				ContentType: ContentType,
			};
			const upload = await s3Upload(paramCH);
			if (!upload) {
				console.error('Error when uploading item image to s3');
				return res
					.status(400)
					.json({ error: 'Error when uploading CH item image to S3' });
			}
		}
		foundProduct.productId = data.productId;
		foundProduct.itemName = data.itemName;
		foundProduct.uom = data.uom;
		foundProduct.description = data.description;
		foundProduct.points = data.points;
		foundProduct.totalBalance = data.totalBalance;
		foundProduct.active = true;
		foundProduct.bmName = data.bmName;
		foundProduct.bmDescription = data.bmDescription;
		foundProduct.chName = data.chName;
		foundProduct.chDescription = data.chDescription;
		foundProduct.filter_by = data.filter_by;
		foundProduct.pickup_optional = data.pickup_optional;
		const saveProduct = await foundProduct.save();
		if (saveProduct) {
			await Category.destroy({ where: { productId: data.key } });
			for (let c = 0; c < data.category.length; c++) {
				const newCat = Category.build({
					name: 'itemCategory',
					productId: data.key,
					categoryChoiceId: data.category[c],
				});
				const saveCat = await newCat.save();
				if (!saveCat) {
					return res
						.status(400)
						.json({ error: 'Failed to generate Product Category' });
				}
			}

			return res.status(200).json({ message: 'Created Successfully.' });
		} else {
			return res.status(400).json({ error: 'Failed to update product' });
		}
	} catch (err) {
		console.error('Error when finding all point shop for user setting');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/category/create', authorizeMwAdmin, async (req, res) => {
	const { name, bmName, chName } = req.body;
	if ((!name, !bmName, !chName)) {
		return res.status(400).json({ error: 'Please fill up the category name' });
	}
	const foundData = await CategoryChoice.findOne({
		where: { name },
	});
	if (foundData) {
		return res.status(400).json({ error: 'Category Name existed.' });
	}
	try {
		const saveCat = CategoryChoice.build({ name, bmName, chName });
		await saveCat.save();
		return res.status(200).json({ message: 'Created Successfully.' });
	} catch (err) {
		console.error('Error when create category');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/vouchertype/create', authorizeMwAdmin, async (req, res) => {
	const { sendData } = req.body;
	const data = JSON.parse(sendData);

	const foundData = await VoucherType.findOne({
		where: { name: data.name, productId: data.productId },
	});
	if (foundData) {
		return res.status(400).json({ error: 'Voucher Type Name existed.' });
	}
	try {
		if (req.files && req.files.file) {
			const ContentType = req.files.file.mimetype;
			const Key = `${
				process.env.S3TYPE
			}/public/settings/vouchertype/eng/${makeid(6)}`;
			const param = {
				Bucket,
				Key: Key,
				Body: req.files.file.data,
				ContentType: ContentType,
			};
			const uploadENG = await s3Upload(param);
			if (!uploadENG) {
				return res.status(400).json({ error: 'Error uploading image ' });
			}
			const urleng = await Promise.resolve(
				s3.getSignedUrlPromise('getObject', { Bucket, Key: Key })
			);
			if (!urleng) {
				return res.status(400).json({ error: 'Failed to get image url' });
			}
			const newType = VoucherType.build({
				name: data.name,
				voucherImage: Key,
				value: data.value,
				type: data.type,
				points: data.points,
				productId: data.productId,
			});

			const savedVoucherType = await newType.save();

			if (savedVoucherType) {
				const saveCat = Category.build({
					name: 'voucherCategory',
					voucherTypeId: savedVoucherType.id,
					categoryChoiceId: 1,
				});
				await saveCat.save();
			}
		} else {
			return res.status(400).json({ error: 'Missing image file' });
		}
		return res.status(200).json({ message: 'success' });
	} catch (err) {
		console.error('Error when finding all brands for user setting');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/voucher/fetch', authorizeMwAdmin, async (req, res) => {
	const data = [];

	try {
		const [result] = await sequelize.query(`
    SELECT vt.*,vt.id as key, COUNT(v.id) AS total,
    SUM(CASE WHEN v.redeemed = true THEN 1 ELSE 0 END) AS redeemed,
    SUM(CASE WHEN v.redeemed = false THEN 1 ELSE 0 END) AS available
    FROM "voucherType" vt
    LEFT JOIN "voucherBatch" vb ON vt.id = vb."voucherTypeId"
    LEFT JOIN "voucher" v ON (vb.id = v."voucherBatchId" OR vt.id = v."voucherTypeId")
    GROUP BY vt.id;
    `);

		return res.status(200).json({ voucherList: result });
	} catch (err) {
		console.error('Error when finding all brands in code dashboard');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/voucher/upload/check', authorizeMwAdmin, async (req, res) => {
	const { file } = req.files;
	if (!file) {
		return res.status(400).json({ error: 'No files' });
	}
	if (file.mimetype !== 'text/csv')
		return res.status(400).json({
			error:
				'Please upload csv file type only, you can download the template in voucher batch details page.',
		});

	const dataString = file.data.toString();
	const lines = dataString.split('\n');

	let codes = [];
	let voucherCodes = [];
	let duplicateCodes = [];
	if (lines.length < 2) {
		return res
			.status(400)
			.json({ error: 'Empty CSV detected, please upload again' });
	} else {
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const columns = line.split(',');
			codes.push(columns[0]);
		}

		const checkCode = await Voucher.findAll({
			where: { code: { [Op.in]: codes }, redeemed: false },
		});
		for (let j = 0; j < codes.length; j++) {
			let compare = checkCode.filter((f) => f.code === codes[j])[0];

			if (!compare && codes[j] !== '' && codes[j] !== null) {
				voucherCodes.push({ key: codes[j], code: codes[j], status: 'SUCCESS' });
			} else if (compare) {
				duplicateCodes.push({
					key: codes[j],
					code: codes[j],
					status: 'DUPLICATED',
				});
			}
		}
	}
	const totalVouchers = lines.length - 1;
	return res.status(200).json({
		totalVouchers,
		voucherCodes: [...voucherCodes, ...duplicateCodes],
		duplicateCodes,
	});
});

router.post('/voucher/batch/create', authorizeMwAdmin, async (req, res) => {
	const { id, codes } = req.body;
	try {
		const foundType = await VoucherType.findByPk(id);
		if (!foundType)
			return res.status(400).json({ error: 'Voucher Type is not found' });

		const newBatch = VoucherBatch.build({
			voucherTypeId: foundType.id,
		});
		if (codes.length === 0) {
			return res.status(400).json({ error: 'Codes not found' });
		}
		const savedBatch = await newBatch.save();
		const processedCodes = codes.map((code) => {
			return {
				code: code.code,
				type: foundType.type,
				amount: foundType.value,
				shopper: false,
				redeemed: false,
				used: false,
				voucherTypeId: foundType.id,
				voucherBatchId: savedBatch.id,
			};
		});

		const savedVouchers = Voucher.bulkCreate(processedCodes);
		if (savedVouchers)
			return res.status(200).json({ message: 'Vouchers uploaded' });
	} catch (err) {
		console.error('Error when finding voucher type in admin upload voucher');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/validate', authorizeMwAdmin, async (req, res) => {
	const { viewData, status } = req.body;
	let checkItemPrice = 0;
	if (status !== 'APPROVED' && status !== 'REJECTED' && status !== 'ISSUE')
		return res.status(400).json({ error: 'Status not found' });
	try {
		const foundTran = await Transaction.findByPk(viewData.id, {
			include: [User, Retailer],
		});

		const foundReceipt = await Receipt.findOne({
			where: { transactionId: foundTran.id },
		});
		if (!foundTran || !foundReceipt) {
			return res.status(400).json({ error: 'Transaction not found' });
		}
		const findUser = await User.findOne({
			where: { id: foundTran.userId, verified: true },
		});

		if (!findUser) {
			return res.status(400).json({ error: 'User not found' });
		}

		const multiplier = await pointMultiplication(foundTran.userId);
		if (!multiplier) {
			return res.status(400).json({ error: 'Multiplier not found' });
		}

		const foundStore = await Retailer.findOne({
			where: { name: viewData.name },
		});
		if (!foundStore) {
			return res.status(400).json({ error: 'Tran Store not found' });
		}

		if (status !== 'REJECTED') {
			const checkDuplicated = await Receipt.findOne({
				where: {
					invoice_No: viewData.invoice_No,
					receipt_date: moment(new Date(viewData.receiptDate)).format(
						'YYYY-MM-DD'
					),
				},
				include: {
					model: Transaction,
					where: {
						status: {
							[Op.in]: ['APPROVED', 'PENDING'],
						},
					},
				},
			});

			if (checkDuplicated) {
				console.log('found', checkDuplicated);
				return res.status(400).json({ error: 'Duplicated Receipt No.' });
			}
		}
		if (status === 'APPROVED') {
			if (
				viewData.receiptDate === 'Invalid date' ||
				!viewData.receiptDate ||
				!moment(viewData.receiptDate).isValid()
			) {
				return res.status(400).json({ error: 'Please fill in receipt date' });
			}

			if (foundTran.status !== 'APPROVED') {
				const getAllSKU = await Sku.findAll();
				await Item.destroy({ where: { transactionId: foundTran.id } });
				for (let i = 0; i < viewData.skuData.length; i++) {
					let skuList = viewData.skuData;
					checkItemPrice += skuList[i].price * skuList[i].quantity;
					let sku = getAllSKU.filter((a) => a.name === skuList[i].name)[0];
					if (sku) {
						const addSKU = new Item({
							quantity: skuList[i].quantity,
							price: skuList[i].price,
							transactionId: foundTran.id,
							skuId: sku.id,
							userId: foundTran.userId,
						});
						const saveSKU = await addSKU.save();
						if (!saveSKU) {
							return res.status(400).json({ error: 'Error saving SKU' });
						}
					} else {
						return res.status(400).json({ error: 'SKU Item not found' });
					}
				}

				if (foundTran.rewardType) {
					const checkVoucher = await Voucher.findOne({
						where: {
							redeemed: false,
							amount: 5,
							shopper: true,
							type: foundTran.rewardType,
						},
					});
					if (!checkVoucher) {
						return res.status(400).json({ error: 'Voucher not found.' });
					} else {
						checkVoucher.redeemed = true;
						checkVoucher.userId = foundTran.userId;
						checkVoucher.transactionId = foundTran.id;
						checkVoucher.redeemedDate = Date.now();
						await checkVoucher.save();
					}
				}

				const callPoint = await giveUserPoint({
					source: 'UPLOAD',
					points:
						parseFloat(checkItemPrice.toFixed(0)) *
						parseFloat(multiplier ? multiplier : 1),
					sourceId: foundTran.id,
					userId: foundTran.userId,
				});
				if (callPoint) {
					await checkUpgradeTier(foundTran.userId);
				} else {
					return res.status(400).json({ error: 'Error saving points' });
				}
			}

			foundTran.status = status;
			foundTran.sales = viewData.recamount;
			foundReceipt.amount = viewData.recamount;
			foundTran.state = viewData.state;
			foundTran.promo = viewData.promo ? true : false;
			foundTran.retailerId = foundStore.id;
			foundTran.validated_date = Date.now();
			foundReceipt.invoice_No = viewData.invoice_No;

			foundReceipt.receipt_date =
				viewData.receiptDate === 'Invalid date' ||
				!viewData.receiptDate ||
				!moment(viewData.receiptDate).isValid()
					? viewData.receiptDate
					: null;

			const saveTran = await foundTran.save();
			const saveReceipt = await foundReceipt.save();

			if (saveTran && saveReceipt) {
				if (findUser.referBy && !findUser.refer) {
					const findReferUser = await User.findOne({
						where: { referralCode: findUser.referBy, verified: true },
					});
					if (!findReferUser) {
						return res.status(400).json({ error: 'Refer User not found' });
					}
					const callPointNew = await giveUserPoint({
						source: 'REFER',
						points: 20,
						sourceId: findUser.id,
						userId: findReferUser.id,
					});
					const callPointRefer = await giveUserPoint({
						source: 'REFER',
						points: 20,
						sourceId: findReferUser.id,
						userId: findUser.id,
					});
					if (!callPointNew || !callPointRefer) {
						return res.status(400).json({ error: 'Error giving point' });
					}
					findUser.refer = true;
					const saveUser = await findUser.save();
					if (!saveUser) {
						return res
							.status(400)
							.json({ error: 'Error updating user\'s refer' });
					}
				}
				return res.status(200).json({ message: 'Success' });
			} else {
				return res.status(400).json({ error: 'Error saving approve receipt' });
			}
		} else if (status === 'REJECTED') {
			if (foundTran.status !== 'APPROVED') {
				if (!viewData.reason) {
					return res.status(400).json({ error: 'Please provide a reason' });
				}
				foundTran.status = status;
				foundTran.reason = viewData.reason;
				foundTran.sales = viewData.recamount || 0;
				foundTran.state = viewData.state || '';
				foundTran.retailerId = foundStore.id;
				foundTran.promo = viewData.promo ? true : false;
				foundTran.validated_date = Date.now();
				foundReceipt.amount = viewData.recamount || 0;
				foundReceipt.invoice_No = viewData.invoice_No || '';
				foundReceipt.receipt_date =
					viewData.receiptDate === 'Invalid date' ||
					!viewData.receiptDate ||
					!moment(viewData.receiptDate).isValid()
						? viewData.receiptDate
						: null;
				const saveTran = await foundTran.save();
				const saveReceipt = await foundReceipt.save();
				if (saveTran && saveReceipt)
					return res.status(200).json({ message: 'Success' });
			} else if (foundTran.status === 'APPROVED') {
				return res
					.status(400)
					.json({ error: 'Transaction can\'t be change after approved' });
			} else {
				return res.status(400).json({ error: 'Error in rejecting receipt' });
			}
		} else if (status === 'ISSUE') {
			if (foundTran.status !== 'APPROVED') {
				foundTran.status = status;
				foundTran.reason = viewData.reason;
			}
			const getAllSKU = await Sku.findAll();
			await Item.destroy({ where: { transactionId: foundTran.id } });
			for (let i = 0; i < viewData.skuData.length; i++) {
				let skuList = viewData.skuData;
				let sku = getAllSKU.filter((a) => a.name === skuList[i].name)[0];
				if (sku) {
					const addSKU = new Item({
						quantity: skuList[i].quantity,
						price: skuList[i].price,
						transactionId: foundTran.id,
						skuId: sku.id,
						userId: foundTran.userId,
					});
					await addSKU.save();
				} else {
					return res.status(400).json({ error: 'SKU Item not found' });
				}
			}

			foundTran.sales = viewData.recamount;
			foundTran.state = viewData.state;
			foundTran.retailerId = foundStore.id;
			foundTran.promo = viewData.promo ? true : false;
			foundTran.validated_date = Date.now();
			foundReceipt.invoice_No = viewData.invoice_No;
			foundReceipt.amount = viewData.recamount;

			const saveTran = await foundTran.save();
			const saveReceipt = await foundReceipt.save();
			if (saveTran && saveReceipt)
				return res.status(200).json({ message: 'Success' });
		}
	} catch (error) {
		console.error('Error caught in admin receipt validation API');
		console.error(error);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/article/fetch', authorizeMwAdmin, async (req, res) => {
	try {
		const articles = await Articles.findAll({
			order: [['updatedAt', 'DESC']],
		});

		return res.status(200).json({ dataList: articles });
	} catch (err) {
		console.error('Error when finding all items');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});
router.post('/article/create', authorizeMwAdmin, async (req, res) => {
	const { sendData } = req.body;
	const data = JSON.parse(sendData);
	const foundArticles = await Articles.findOne({
		where: {
			title: data.title,
		},
	});

	if (foundArticles) {
		return res.status(400).json({ error: 'Article already existed.' });
	}

	try {
		if (req.files && req.files.file && req.files.file2 && req.files.file3) {
			const ContentType = req.files.file.mimetype;
			const ContentTypeBM = req.files.file2.mimetype;
			const ContentTypeCH = req.files.file3.mimetype;
			const Key = `${process.env.S3TYPE}/public/settings/article/eng/${makeid(
				8
			)}`;
			const KeyBM = `${process.env.S3TYPE}/public/settings/article/bm/${makeid(
				8
			)}`;
			const KeyCH = `${process.env.S3TYPE}/public/settings/article/ch/${makeid(
				8
			)}`;
			const param = {
				Bucket,
				Key: Key,
				Body: req.files.file.data,
				ContentType: ContentType,
			};
			const paramBM = {
				Bucket,
				Key: KeyBM,
				Body: req.files.file2.data,
				ContentType: ContentTypeBM,
			};
			const paramCH = {
				Bucket,
				Key: KeyCH,
				Body: req.files.file3.data,
				ContentType: ContentTypeCH,
			};

			const uploadENG = await s3Upload(param);
			const uploadBM = await s3Upload(paramBM);
			const uploadCH = await s3Upload(paramCH);
			if (!uploadENG || !uploadBM || !uploadCH) {
				console.error('Error when uploading item image to s3');
				return res
					.status(400)
					.json({ error: 'Error when uploading article image to S3' });
			}

			const newArticle = Articles.build({
				authorName: data.authorName,
				authorNameCH: data.authorNameCH,
				articleCategory: data.articleCategory,
				title: data.title,
				titleBM: data.titleBM,
				titleCH: data.titleCH,
				description: data.description,
				descriptionBM: data.descriptionBM,
				descriptionCH: data.descriptionCH,
				imageKey: Key,
				bmImageKey: KeyBM,
				chImageKey: KeyCH,
				active: true,
			});

			const saveArticle = await newArticle.save();
			if (saveArticle) {
				return res.status(200).json({ message: 'Created Successfully.' });
			} else {
				return res.status(400).json({ error: 'Error saving article' });
			}
		} else {
			return res.status(400).json({ error: 'Article Image not found' });
		}
	} catch (err) {
		console.error('Error when finding all articles');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/article/update', authorizeMwAdmin, async (req, res) => {
	const { sendData } = req.body;
	const data = JSON.parse(sendData);

	const foundArticle = await Articles.findOne({ where: { id: data.id } });

	if (!foundArticle) {
		return res.status(400).json({ error: 'Article existed.' });
	}

	try {
		if (req.files && req.files.file) {
			const ContentType = req.files.file.mimetype;
			const Key = foundArticle.imageKey;
			const param = {
				Bucket,
				Key: Key,
				Body: req.files.file.data,
				ContentType: ContentType,
			};

			const upload = await s3Upload(param);
			if (!upload) {
				console.error('Error when uploading item image to s3');
				return res.status(400).json({ error: 'Internal Error' });
			}
		}
		if (req.files && req.files.file2) {
			const ContentTypeBM = req.files.file2.mimetype;
			const KeyBM = foundArticle.bmImageKey;
			const paramBM = {
				Bucket,
				Key: KeyBM,
				Body: req.files.file2.data,
				ContentType: ContentTypeBM,
			};
			const upload = await s3Upload(paramBM);
			if (!upload) {
				return res.status(400).json({ error: 'Internal Error' });
			}
		}

		if (req.files && req.files.file3) {
			const ContentTypeCH = req.files.file3.mimetype;
			const KeyCH = foundArticle.chImageKey;
			const paramCH = {
				Bucket,
				Key: KeyCH,
				Body: req.files.file3.data,
				ContentType: ContentTypeCH,
			};
			const upload = await s3Upload(paramCH);
			if (!upload) {
				return res.status(400).json({ error: 'Internal Error' });
			}
		}

		foundArticle.title = data.title;
		foundArticle.titleBM = data.titleBM;
		foundArticle.titleCH = data.titleCH;
		foundArticle.description = data.description;
		foundArticle.descriptionBM = data.descriptionBM;
		foundArticle.descriptionCH = data.descriptionCH;
		foundArticle.active = true;

		const saveArticle = await foundArticle.save();
		if (saveArticle) {
			return res.status(200).json({ message: 'Created Successfully.' });
		} else {
			return res.status(400).json({ error: 'Error updating in article' });
		}
	} catch (err) {
		console.error('Error when finding all articles');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});
router.post('/transaction/update', authorizeMwAdmin, async (req, res) => {
	const { sendData } = req.body;
	const data = JSON.parse(sendData);
	const foundOrderId = await Order.findOne({ where: { id: data.orderid } });

	if (!foundOrderId) {
		return res.status(400).json({ error: 'Order id not existed!' });
	}
	try {
		foundOrderId.status = data.status;
		foundOrderId.remark = data.remark;

		const saveUpdate = await foundOrderId.save();
		if (saveUpdate) {
			return res.status(200).json({ message: 'Created Successfully.' });
		} else {
			return res.status(400).json({ error: 'Error updating in transaction' });
		}
	} catch (err) {
		console.error('Error when finding order details');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/rating/update', async (req, res) => {
	const { sendData } = req.body;
	const data = JSON.parse(sendData);
	const foundRatingId = await Rating.findOne({ where: { id: data.id } });

	if (!foundRatingId) {
		return res.status(400).json({ error: 'Rating/Review id not existed!' });
	}

	try {
		foundRatingId.status = data.status;
		await foundRatingId.save();

		return res.status(200).json({ message: 'Update Review and Rating status' });
	} catch (err) {
		console.error('Error when finding user rating and review details');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/payment/info/fetch', async (req, res) => {
	try {
		const [result] = await sequelize.query(`
    SELECT
    c.*,
    c.id as key,
    c."statementID" AS statementID,
    c.name AS retailer_name,
    c.number AS number,
    c.bank_account,
    c.bank_name,
    c.status,
    c.redeem_amount AS redeemAmount,
    c."createdAt",
    r.name AS storename
    FROM
    claim as c
    JOIN 
    retailer as r 
    ON     
    c."retailerId" = r.id
    `);
		return res.status(200).json({ data: result });
	} catch (err) {
		console.error('Error when finding all items');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

router.post('/payment/info/update', async (req, res) => {
	const { sendData } = req.body;
	const data = JSON.parse(sendData);
	const foundRetailerPayment = await Claim.findOne({
		where: { retailerId: data.retailerId, redeem_amount: data.redeem_amount },
	});

	if (!foundRetailerPayment) {
		return res.status(400).json({ error: 'Payment not found!' });
	}

	try {
		foundRetailerPayment.name = data.name;
		foundRetailerPayment.number = data.number;
		foundRetailerPayment.status = data.status;
		foundRetailerPayment.paymentType = data.paymentType;
		foundRetailerPayment.bank_name = data.bankname;
		foundRetailerPayment.bank_account = data.bankaccount;
		await foundRetailerPayment.save();

		return res
			.status(200)
			.json({ message: 'Update retailer\'s payment status' });
	} catch (err) {
		console.error('Error when finding retailer\'s payment information');
		console.error(err);
		return res.status(400).json({ error: 'Internal Error' });
	}
});

module.exports = router;