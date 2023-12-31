require("dotenv").config();
const { Sequelize } = require("sequelize");

const { DB_NAME, DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

module.exports = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
	host: DB_HOST,
	port: DB_PORT,
	dialect: "postgres",
	logging: false,
	pool: {
		max: 10,
		min: 0,
		acquire: 3000000,
		idle: 10000
	},
	dialectOptions: {
		ssl: {
		require: true,
		rejectUnauthorized: false
	}
	}
});