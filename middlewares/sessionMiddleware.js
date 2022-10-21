var session = require('express-session')

module.exports = {
    adminSession: (req, res, next) => {
        if (req.session.adminLogin)
            return next();
        res.redirect('/admin');
        
        
    },
    userSession: (req, res, next)=>{
        if (req.session.userLogin)
            return next();
        res.redirect('/login');
    }

}