const router = require('express').Router();
const menus = require('../controllers/menus.controller');

router.get('/', menus.listMenus);
router.get('/:id', menus.getMenu);
router.post('/', menus.createMenu);
router.put('/:id', menus.updateMenu);
router.delete('/:id', menus.deleteMenu);

module.exports = router;
