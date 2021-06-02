import { expect } from 'chai'
import request from 'supertest'

import app from '../app'
import User from '../models/user'
import Token from '../models/token'
import UserProduct from '../models/userproduct'
import Product from '../models/product'

let accessToken
let testProductId
let testUser
let userProductId
let userProductDate

before(async () => {
    testUser = new User({
        username: 'fake',
        email: 'fake@test',
        role: 'user'
    })

    const hash = testUser.generateHash("fake")
    
    testUser.password = hash
    
    await testUser.save()

    const res = await request(app)
        .post('/users/login')
        .send({
            username: 'fake',
            password: 'fake'
        })

    accessToken = res.body.accessToken 

    const product = new Product()
            
    product.kcal = 10
    product.name = 'test'
    product.carbs = 10
    product.prots = 10
    product.fats = 10

    await product.save()
    
    testProductId = product.id
    
    let userProduct = new UserProduct()

    userProduct.product_id = testProductId
    userProduct.user_id = testUser.id
    userProduct.quantity = 10

    await userProduct.save()

    userProductId = userProduct.id
    userProductDate = JSON.stringify(userProduct.date).split('T')[0]
})

describe('Dashboard routes', () => {
    describe('GET /:date', () => {  
        it('It should return correct body and status code', async () => {
            const res = await request(app)
            .get('/2021-05-28')
            .set('Cookie', `JWT=${accessToken}`)
            .send()
        
            expect(res.body).to.be.an('object').to.have.all.keys('userProducts', 'summary')
            expect(res.body.userProducts).to.be.an('array')
            expect(res.body.summary).to.be.an('object').to.have.all.keys('kcal', 'carbs', 'prots', 'fats')
            expect(res.status).to.eq(200)
        })

        it('It should return correct calculations', async () => {
            const res = await request(app)
            .get(`/${userProductDate}`)
            .set('Cookie', `JWT=${accessToken}`)
            .send()

            expect(res.body.summary.kcal).to.eq(1)
            expect(res.body.summary.carbs).to.eq(1)
            expect(res.body.summary.prots).to.eq(1)
            expect(res.body.summary.fats).to.eq(1)
        })

        it('It should failed with 400 status code, invalid date', async () => {
            const res = await request(app)
            .get('/test')
            .set('Cookie', `JWT=${accessToken}`)
            .send()

            expect(res.status).to.eq(400)
        })
    })

    describe('POST /', () => { 
        it('It should return correct body and status code', async () => {
            const res = await request(app)
            .post('/')
            .set('Cookie', `JWT=${accessToken}`)
            .send({
                "productId": testProductId,
                "quantity": 20,
                "date": "2021-05-28T14:58:25.817Z"
            })
        
            expect(res.body).to.be.an('object').to.have.all.keys('product', 'quantity', '_id', 'date')
            expect(res.body.product).to.be.an('object').to.have.all.keys('name', 'kcal', 'carbs', 'prots', 'fats')
            expect(res.status).to.eq(200)
        })

        it('It should return correct calculations', async () => {
            const res = await request(app)
            .post('/')
            .set('Cookie', `JWT=${accessToken}`)
            .send({
                "productId": testProductId,
                "quantity": 20,
                "date": "2021-05-28T14:58:25.817Z"
            })

            expect(res.body.product.kcal).to.eq(2)
            expect(res.body.product.carbs).to.eq(2)
            expect(res.body.product.prots).to.eq(2)
            expect(res.body.product.fats).to.eq(2)
        })

        it('It should failed with 400 status code, because of productId', async () => {
            const res = await request(app)
            .post('/')
            .set('Cookie', `JWT=${accessToken}`)
            .send({
                "productId": -1,
                "quantity": 20,
                "date": "2021-05-28T14:58:25.817Z"
            })
        
            expect(res.status).to.eq(400)
        })

        it('It should failed with 400 status code, because of quantity', async () => {
            const res = await request(app)
            .post('/')
            .set('Cookie', `JWT=${accessToken}`)
            .send({
                "productId": testProductId,
                "quantity": 0,
                "date": "2021-05-28T14:58:25.817Z"
            })
        
            expect(res.status).to.eq(400)
        })
    })

    describe('PATCH /:id', () => {
        it('It should return correct body and status code', async () => {
            const res = await request(app)
            .patch(`/${userProductId}`)
            .set('Cookie', `JWT=${accessToken}`)
            .send({
                "quantity": 10
            })
        
            expect(res.body).to.be.an('object').to.have.all.keys('product', 'quantity', '_id', 'date')
            expect(res.body.product).to.be.an('object').to.have.all.keys('name', 'kcal', 'carbs', 'prots', 'fats')
            expect(res.status).to.eq(200)
        })

        it('It should return correct calculations', async () => {
            const res = await request(app)
            .patch(`/${userProductId}`)
            .set('Cookie', `JWT=${accessToken}`)
            .send({
                "quantity": 10
            })

            expect(res.body.product.kcal).to.eq(1)
            expect(res.body.product.carbs).to.eq(1)
            expect(res.body.product.prots).to.eq(1)
            expect(res.body.product.fats).to.eq(1)
        })

        it('It should failed with 404 status code, user product not found', async () => {
            const res = await request(app)
            .patch(`/${testUser.id}`)
            .set('Cookie', `JWT=${accessToken}`)
            .send({
                "quantity": 10
            })
        
            expect(res.status).to.eq(404)
        })

        it('It should failed with 404 status code, invalid user product id', async () => {
            const res = await request(app)
            .patch(`/1234`)
            .set('Cookie', `JWT=${accessToken}`)
            .send({
                "quantity": 10
            })
        
            expect(res.status).to.eq(404)
        })

        it('It should failed with 400 status code, because of quantity', async () => {
            const res = await request(app)
            .patch(`/${testUser.id}`)
            .set('Cookie', `JWT=${accessToken}`)
            .send()
        
            expect(res.status).to.eq(400)
        })
    })

    describe('DELETE /:id', () => {
        it('It should return correct body and status code', async () => {
            const res = await request(app)
            .delete(`/${userProductId}`)
            .set('Cookie', `JWT=${accessToken}`)
            .send()

            expect(res.status).to.eq(204)
        })

        it('It should faild with 404 status code, invalid user product id', async () => {
            const res = await request(app)
            .delete(`/1234`)
            .set('Cookie', `JWT=${accessToken}`)
            .send()

            expect(res.status).to.eq(404)
        })

        it('It should faild with 404 status code, user product id not found', async () => {
            const res = await request(app)
            .delete(`/${testUser.id}`)
            .set('Cookie', `JWT=${accessToken}`)
            .send()

            expect(res.status).to.eq(404)
        })
    })

    after(async () => {
        await User.remove({})
        await Token.remove({})
        await UserProduct.remove({})
        await Product.remove({})
    })
})

