module.exports = function (sequelize, DataTypes) {
	return sequelize.define('user', {
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [1, 50]
			}
		}
	});
};