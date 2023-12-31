const sequelize = require("./sequelize");
const Order = require("./tables/transaction/Order");
const OrderItems = require("./tables/transaction/OrderItems");

const Address = require("./tables/user/Address");
const Inbox = require("./tables/user/Inbox");
const Point = require("./tables/user/Point");
const Code = require("./tables/settings/code/Code");
const Voucher = require("./tables/settings/voucher/Voucher");
const VoucherBatch = require("./tables/settings/voucher/VoucherBatch");
const Inventory = require("./tables/settings/Inventory");
const VoucherType = require("./tables/settings/voucher/VoucherType");
const Product = require("./tables/settings/item/Product");
const Category = require("./tables/settings/item/Category");
const CategoryChoice = require("./tables/settings/CategoryChoice");
const Cart = require("./tables/user/Cart");
const TierHistory = require("./tables/misc/TierHistory");
const User = require("./tables/user/User");
const Retailer = require("./tables/store/Retailer");

const Transaction = require("./tables/transaction/Transaction");
const Item = require("./tables/transaction/Item");
const Receipt = require("./tables/transaction/Receipt");
const Sku = require("./tables/settings/Sku");
const Event = require("./tables/misc/Event");
const TagReceipt = require("./tables/transaction/TagReceipt");
const Rating = require("./tables/settings/Rating");
const Claim = require("./tables/store/Claim");

sequelize
  .authenticate()
  .then(() => console.log("Connected to database success"))
  .catch((err) => {
    console.error("Connection to database failed");
    console.error(err);
  });

// relationships & associations
User.hasMany(Address);
Address.belongsTo(User);

User.hasMany(Inbox);
Inbox.belongsTo(User);

Retailer.hasMany(Transaction);
Transaction.belongsTo(Retailer);
Retailer.hasMany(TagReceipt);
TagReceipt.belongsTo(Retailer);

Retailer.hasMany(User);
User.belongsTo(Retailer);

Retailer.hasMany(Claim);
Claim.belongsTo(Retailer);

User.hasMany(Point);
Point.belongsTo(User);

Point.belongsTo(User);
User.hasMany(Order);
Order.belongsTo(User);

///////////////  ORDER ////////////////////////
Address.hasMany(Order);
Order.belongsTo(Address);

Order.hasMany(OrderItems);
OrderItems.belongsTo(Order);

Retailer.hasMany(Order);
Order.belongsTo(Retailer);

Product.hasMany(Inventory);
Inventory.belongsTo(Product);

User.hasMany(TierHistory);
TierHistory.belongsTo(User);

User.hasMany(Code);
Code.belongsTo(User);

VoucherType.hasMany(VoucherBatch);
VoucherBatch.belongsTo(VoucherType);

VoucherBatch.hasMany(Voucher);
Voucher.belongsTo(VoucherBatch);

VoucherType.hasMany(Voucher);
Voucher.belongsTo(VoucherType);

User.hasMany(Voucher);
Voucher.belongsTo(User);

Product.hasMany(Category);
Category.belongsTo(Product);
CategoryChoice.hasMany(Category);
Category.belongsTo(CategoryChoice);

Category.hasMany(Cart);
Cart.belongsTo(Category);
User.hasMany(Cart);
Cart.belongsTo(User);

VoucherType.hasMany(Category);
Category.belongsTo(VoucherType);

User.hasMany(Transaction);
Transaction.belongsTo(User);

Transaction.hasMany(Receipt);
Receipt.belongsTo(Transaction);

///// Event /////

Retailer.hasMany(Event);
Event.belongsTo(Retailer);

User.hasMany(Event);
Event.belongsTo(User);

Transaction.hasMany(Event);
Event.belongsTo(Transaction);

/////  ITEM //////

Transaction.hasMany(Item);
Item.belongsTo(Transaction);
Transaction.hasMany(Voucher);
Voucher.belongsTo(Transaction);
Sku.hasMany(Item);
Item.belongsTo(Sku);

/////////  RATING //////////////
User.hasMany(Rating);
Rating.belongsTo(User);
Product.hasMany(Rating);
Rating.belongsTo(Product);
Product.hasMany(OrderItems);
OrderItems.belongsTo(Product);
VoucherType.hasMany(OrderItems);
OrderItems.belongsTo(VoucherType);

// sync table

// sequelize
// 	.sync({ alter: true, })
// 	.then(() => {
// 		console.log("Database synced");
// 		// console.log(data);
// 	})
// 	.catch(err => {
// 		console.error("Error when syncing database");
// 		console.error(err);
// 	});

module.exports = sequelize;
