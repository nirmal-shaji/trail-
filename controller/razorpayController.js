const Razorpay = require('razorpay');
const crypto = require('crypto');

var instance = new Razorpay({
  key_id: process.env.RAZOR_PAY_ID,
  key_secret: process.env.RAZOR_PAY_SECRET_KEY,
});


module.exports = {
  intiateRazorpay: async(orderId, amount) => { 
    
   
   value= await instance.orders.create({
    amount: amount,
    currency: "INR",
    receipt: orderId+" ",
    notes: {
      key1: "value3",
      key2: "value2"
    }
   })
    return value;
   
  },
  validate: async (razorData) => {
 
    
    
   
    let hmac = crypto.createHmac('sha256', process.env.RAZOR_PAY_SECRET_KEY);
   await  hmac.update(razorData['razorResponse[razorpay_order_id]'] + '|' + razorData['razorResponse[razorpay_payment_id]']);
    hmac =await hmac.digest('hex');
    if (hmac == razorData['razorResponse[razorpay_signature]'])
      return orderConfirmed = true;
    
    return orderConfirmed = false;
  }
  
}