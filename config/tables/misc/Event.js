const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { DATE, STRING, BOOLEAN, FLOAT } = DataTypes;

class Event extends Model {}

Event.init(
	{
		id: {
			type: DataTypes.INTEGER,
		    autoIncrement: true,
		    primaryKey: true,
		    unique: true
		},
		type: {
			type: STRING,
			allowNull: false,
			comment: "type of event"
		},
		amount: {
			type: FLOAT,
			allowNull: true,
			comment: "amount of event"
		}
	},
	{
		sequelize,
		timestamps: true,
		createdat: true,
		updatedat: true,
		comment: "To store all event details",
		tableName: "event",
		modelName: "event"
	}
);

module.exports = Event;
