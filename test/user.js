import { expect } from 'chai'
import request from 'supertest'

import app from '../app'
import User from '../models/user'
import Token from '../models/token'

describe('User login routes', () => {
    describe('POST /register', () => {
        it('It should return message: User created', async () => {
            const res = await request(app)
            .post('/users/register')
            .send({
                username: 'test',
                password: 'test',
                email: 'test@test'
            })
        
            expect(res.status).to.eq(200)
            expect(res.body).to.have.property('message')
            expect(res.body.message).to.eq('User created')
        })

        it('It should return 400 without body', async () => {
            const res = await request(app)
            .post('/users/register')
            .send({ })
        
            expect(res.status).to.eq(400)
        })

        it('It should return 403 when user exists', async () => {
            const res = await request(app)
            .post('/users/register')
            .send({
                username: 'test',
                password: 'test',
                email: 'test@test'
            })
        
            expect(res.status).to.eq(403)
        })
    })

    let refreshToken;

    describe('POST /login', () => {
        it('It should return 400 when credentials not provided', async () => {
            const res = await request(app)
            .post('/users/login')
            .send()
        
            expect(res.status).to.eq(400)
        })

        it('It should return 401 when user not found', async () => {
            const res = await request(app)
            .post('/users/login')
            .send({
                username: 'zdzichu',
                password: 'test'
            })
        
            expect(res.status).to.eq(401)
        })

        it('It should return 401 when user password not mach', async () => {
            const res = await request(app)
            .post('/users/login')
            .send({
                username: 'test',
                password: 'zdzichu'
            })
        
            expect(res.status).to.eq(401)
        })

        it('It should return tokens when authentication is ok', async () => {
            const res = await request(app)
            .post('/users/login')
            .send({
                username: 'test',
                password: 'test'
            })
        
            expect(res.status).to.eq(200)
            expect(res.body).to.have.property('accessToken')
            expect(res.body).to.have.property('refreshToken')
            refreshToken = res.body.refreshToken
            expect(res.header['set-cookie'][0].split('=')[0]).to.eq('JWT') //czy ustawiło ciastko o nazwie JWT
        })
    })


    describe('POST /refresh', () => {
        it('It should return 401 when token cookie not provided', async () => {
            const res = await request(app)
            .post('/users/refresh')
            .send()
        
            expect(res.status).to.eq(401)
        })

        it('It should return new token when refresh token is ok', async () => {
            const res = await request(app)
            .post('/users/refresh')
            .send({
                token: refreshToken
            })
            expect(res.status).to.eq(200)
            expect(res.body).have.property('accessToken')
            expect(res.header['set-cookie'][0].split('=')[0]).to.eq('JWT') //czy ustawiło ciastko o nazwie JWT
        })
    })

    describe('DELETE /logout', () => {
        it('It should return 401 when token not provided', async () => {
            const res = await request(app)
            .delete('/users/logout')
            .send()
        
            expect(res.status).to.eq(401)
        })

        it('It should return 404 when refresh token is not in db', async () => {
            const res = await request(app)
            .delete('/users/logout')
            .send({
                token: 'nie ma mnie w bazie'
            })
        
            expect(res.status).to.eq(404)
        })

        it('It should return message: User successfully logout', async () => {
            const res = await request(app)
            .delete('/users/logout')
            .send({
                token: refreshToken
            })
        
            expect(res.status).to.eq(200)
            expect(res.body).to.have.property('message')
            expect(res.body.message).to.eq('User successfully logout')
        })
    })

    after(async () => {
        await User.remove({})
        await Token.remove({})
    })
})

