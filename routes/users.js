import express from 'express'
import jwt from 'jsonwebtoken'

import User from '../models/user'
import Token from '../models/token'

const users = express.Router()

users.post('/login', async (req, res) => {
    const username = req.body.username ? req.body.username : ""
    const password = req.body.password ? req.body.password : ""

    if(username.length <= 0 || password.length <= 0)
        return res.sendStatus(400)

    try{
        const user = await User.findOne({username}).exec()
        if(!user){
            res.sendStatus(401) 
            return
        }
        if(!user.validatePassword(password)){
            res.sendStatus(401)
            return
        }

        const accessToken = generateAccessToken({id: user.id, role: user.role})
        const refreshToken = jwt.sign({id: user.id, role: user.role}, process.env.REFRESH_TOKEN_SECRET)
    
        let token = Token({
            refresh: refreshToken
        })

        await token.save()

        res.cookie('JWT', accessToken, {
            maxAge: 86400000,
            httpOnly: true
        })
    
        res.send({accessToken, refreshToken})
    }  
    catch(e) {
        res.sendStatus(500)
    }
})

users.post('/register', async (req, res) => {
    const username = req.body.username ? req.body.username : ""
    const password = req.body.password ? req.body.password : ""
    const email = req.body.email ? req.body.email : ""

    if (username.length <= 0 || password.length <= 0 || email.length <= 0)
        return res.sendStatus(400)


    try{
        const user = await User.findOne({$or: [{username}, {email}],}).exec()
        if(user){
            res.sendStatus(403) 
            return
        }

        let newUser = new User()
        newUser.username = username
        newUser.password = newUser.generateHash(password)
        newUser.email = email
        newUser.role = 'user'

        newUser.save(err => {
            if(err) throw err
            res.json({message: "User created"})
        })
    }  
    catch(e) {
        console.log(e)
        res.sendStatus(500)
    }
})

users.post('/refresh', async (req, res) => {
	const refreshToken = req.body.token

	if (!refreshToken) {
		return res.sendStatus(401)
	}

	try{
        
        if(!await Token.exists({refresh: refreshToken})) return res.sendStatus(403)

        const validToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

        if (!validToken) {
            return res.sendStatus(403)
        }
        
        const accessToken = generateAccessToken({ id: validToken.id, role: validToken.role })

        res.cookie('JWT', accessToken, {
            maxAge: 86400000,
            httpOnly: true
        })

        res.send({ accessToken })
    }
    catch(e)
    {
        console.log(e)
        res.sendStatus(500)
    }
})

users.delete('/logout', async(req, res) => {
	const refreshToken = req.body.token

	if (!refreshToken) {
		return res.sendStatus(401)
	}

    try{
        const token = await Token.findOneAndRemove({refresh: refreshToken}).exec()

        if(!token)
            return res.sendStatus(404)

        res.clearCookie("JWT")

        res.json({ message: "User successfully logout" })
    }
    catch(e)
    {
        console.log(e)
        res.sendStatus(500)
    }

})

function generateAccessToken(payload) {
	return jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: 86400 })
}

function authenticate(req, res, next) {
    const token = req.cookies.JWT

    if(token == null) return res.sendStatus(401)
    
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        if(err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

function isAdmin(req, res, next){
    if (req.user.role !== 'admin')
        return res.sendStatus(403)
    next()
}

export {authenticate, users, isAdmin}