const express = require('express');
const User = require('../model');
const bcrypt = require('bcryptjs'); // Import bcrypt module
const generateToken = require('../utils');
const veriftyToken = require('../middleware');
const nodemailer = require("nodemailer")
const router = express.Router();

router.get('/test', (req,res) => 
res.json({message:" Api Teting Successful"})
);

router.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
}); 

router.post('/users', async (req,res) => {
    const {email , password} = req.body;

    const user = await User.findOne({email})

    if(!user){
   const hashedPassword = await bcrypt.hash(password, 10);

   const newUser = new User({email, password: hashedPassword}) 

   await newUser.save();

   return res.status(201).json({message:'user created'})

    }

    res.status(404).json({messege: "user alread exist"})

}


);


router.post('/authenticate', async (req, res) =>{
    const {email,password} = req.body;

    const user = await User.findOne({ email });

    if(!user){
        return res.status(404).json({message:"User not found"})
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        return res.status(401).json({message: "Incorrect password"})
    }

    const token = generateToken(user)

    res.json({ token })
})

router.get('/data', veriftyToken , (req, res) =>{
    res.json({message : `welcome,  ${req.user.email}! this is protected data` })
})


router.post('/reset-password', async (req, res) => {

    const{ email } = req.body;

    const user = await User.findOne({email});
console.log(user,">>>>>>user")
    if(!user){
        return res.status(404).json({message: "user not found"})
    }

    const token = Math.random().toString(36).slice(-8);

    user.resetPasswordToken = token;
    user.restPasswordExpires = Date.now() + 36000000

    await user.save();

    const tranporter = nodemailer.createTransport({
        service : "gmail",
        auth: {
            user:"kathirvel082@gmail.com",
            pass : "fkmx wutb snaq oksv"
        },
    })
    const message = {
        from : "kathirvel082@gmail.com",
        to:user.email,
        subject : "password reset request",
        text:`you receving password reset account ${token}`
    }

    tranporter.sendMail(message,(err, info) =>{
        if(err){
            res.status(404).json({message: "soming wrong"});

        }
        res.status(200).json({message: "password reset email sent" + info.response})
    })
})

router.post("/reset-password/:token", async (req, res) =>{

    const { token } = req.params;
    const { password }  = req.body;
console.log(token,"token")

const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
});

    console.log({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    console.log(user,"user")
    
    if(!user){
        return res.status(404).json({message:"Invalid token"})
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({message : " password reset successful"})

})



module.exports = router;