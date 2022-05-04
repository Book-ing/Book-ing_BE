const USER = require('../schemas/user')
module.exports = {
    checkUser: async (userId) => {
        try {
            return USER.findOne({ userId });
        } catch (error) {
            console.log(error);
        }
    },
}