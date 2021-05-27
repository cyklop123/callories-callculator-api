import express from 'express'
import jwt from 'jsonwebtoken'

import User from '../models/user'

const users = express.Router()

users.post('/login', async (req, res) => {
    const username = req.body.username ? req.body.username : ""
    const password = req.body.password ? req.body.password : ""

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

        const accessToken = jwt.sign({id: user.id, role: user.role}, process.env.TOKEN_SECRET, { expiresIn: 86400 })
        const refreshToken = jwt.sign({id: user.id}, process.env.REFRESH_TOKEN_SECRET, { expiresIn: 525600 })
    
        //save refresh token in db

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

    try{
        const user = await User.findOne({$or: [{username}, {email}],}).exec()
        if(user){
            res.sendStatus(403) 
            return
        }

        if (username.lenght < 3 || password < 3 || email < 5)
        {
            res.sendStatus(404)
            return
        }

        let newUser = new User()
        newUser.username = username
        newUser.password = newUser.generateHash(password)
        newUser.email = email
        newUser.role = 'user'

        newUser.save(err => {
            if(err) throw err
            res.send("User created")
        })
    }  
    catch(e) {
        console.log(e)
        res.sendStatus(500)
    }
})

users.post('/refresh', (req, res) => {
	const refreshToken = req.body.token

	if (!refreshToken) {
		return res.status(401)
	}

	// TODO: Check if refreshToken exists in DB

	const validToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

	if (!validToken) {
		return res.status(403)
	}

	const accessToken = generateAccessToken({ id: 1 })

	res.send({ accessToken })
})

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