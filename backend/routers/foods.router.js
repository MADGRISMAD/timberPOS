const router = require('express').Router();
const menus = require('../controllers/menus.controller');

router.get('/', menus.listFoods);
router.get('/:id', menus.getFood);
router.post('/', menus.createFood);
router.put('/:id', menus.updateFood);
router.delete('/:id', menus.deleteFood);

module.exports = router;
