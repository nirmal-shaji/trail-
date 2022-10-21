var express = require('express');
const multer = require('multer');
var router = express.Router();
const admin = require('../controller/adminController');
const session = require('../middlewares/sessionMiddleware')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/product_uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        ;
        cb(null,uniqueSuffix + '-' +file.originalname   )
    }
});




const upload = multer({ storage: storage });

// --------------------------------------------------------------------------------------------------------------------------
const storages = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/bannerImages');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        ;
        cb(null,uniqueSuffix + '-' +file.originalname   )
    }
});

const uploads = multer({ storage: storages });



/* GET users listing. */
router.get('/', admin.loginPage);
router.post('/', admin.login);


router.get('/dashboard', session.adminSession, admin.dashboard);
router.post('/dashboardGraph', session.adminSession, admin.graphData);
router.get('/userData', session.adminSession, admin.userData);
router.get('/categoryData', session.adminSession, admin.categoryData);
router.get('/productData',session.adminSession , admin.productData);   
router.get('/couponData', session.adminSession, admin.couponData);
router.get('/bannerData', session.adminSession, admin.bannerData);
router.get('/orderData', session.adminSession, admin.orderData);


router.get('/addProduct', session.adminSession, admin.renderAddProduct);
router.post('/addproduct',session.adminSession , upload.array('photos', 5), admin.addProduct);

router.get('/addCoupon', session.adminSession, admin.renderAddCoupon);
router.post('/addCoupon', session.adminSession, admin.addCoupon);




router.post('/block',session.adminSession , admin.userBlock);
router.post('/unblock', session.adminSession, admin.userUnblock);

// --------------------------------------------------Category section--------------------------------------------------------------------------------
router.get('/addCategories', session.adminSession ,admin.renderAddCategory);
router.post('/addCategories', session.adminSession, admin.addCategory);

router.get('/editCategory/:id', session.adminSession ,admin.renderEditCategory);
router.post('/editCategory/:id', session.adminSession, admin.editCategory);

router.get('/deleteCategory/:id',session.adminSession , admin.deletecategory);

// --------------------------------------------------Banner section--------------------------------------------------------------------------------

router.get('/addBanner', session.adminSession, admin.renderAddBanner);
router.post('/addBanner', session.adminSession, uploads.single('image'), admin.addBanner);






router.get('/editProduct/:id',session.adminSession , admin.renderEditProduct);
router.post('/editProduct/:id',session.adminSession ,upload.array('photos', 5), admin.editProduct);
router.get('/deleteProduct/:id', session.adminSession, admin.deleteProduct);


router.get('/editCoupon/:id', session.adminSession, admin.renderEditCoupon);
router.post('/editCoupon/:id', session.adminSession, admin.editCoupon);
router.get('/deleteCoupon/:id', session.adminSession, admin.deleteCoupon);


router.get('/editOrderStatus/:id', session.adminSession, admin.renderEditOrderStatus);
router.post('/editOrderStatus/:id', session.adminSession, admin.editOrderStatus);

router.get('/editBanner/:id', session.adminSession,admin.renderEditBanner);
router.post('/editBanner/:id',session.adminSession,uploads.single('image'),admin.editBanner)
router.get('/deleteBanner/:id', session.adminSession, admin.deleteBanner);
router.get('/logout',session.adminSession,admin.logout)



//error page
router.use(admin.errorCreate);
  
  router.use(admin.errorPage);
  
module.exports = router;
