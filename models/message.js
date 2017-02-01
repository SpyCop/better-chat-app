module.exports = function (sequelize, DataTypes) {
	return sequelize.define('message', {
		content: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [1, 250]
			}
		}
	});

	
};