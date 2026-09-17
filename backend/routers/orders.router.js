const router = require('express').Router();
const orders = require('../controllers/orders.controller');

router.get('/', orders.list);
router.get('/:id', orders.getById);
router.post('/', orders.create);
router.put('/:id/status', orders.updateStatus);
router.put('/:id/pay', orders.pay);

module.exports = router;
