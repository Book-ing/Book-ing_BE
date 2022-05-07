const router = require('express').Router();
const searchController = require('../controllers/searchController');
const authMiddelware = require('../middlewares/auth-middlewares');

router.get('/', authMiddelware, searchController.getSelectSearchMeeting);

module.exports = router;