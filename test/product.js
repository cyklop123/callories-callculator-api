import { expect } from 'chai'
import request from 'supertest'

import app from '../app'
import User from '../models/user'
import Token from '../models/token'
import Product from '../models/product'

describe('Product routes', () => {

let mockedProducts

before(async () => {
    mockedProducts = await Product.insertMany([
        { carbs: 4.1, fats: 0.2, kcal: 19, name: 'Pomidor', prots: 0.9 },
        { carbs: 4, fats: 100, kcal: 884, name: 'Oliwa z oliwek', prots: 0 },
        { carbs: 0, fats: 92, kcal: 828, name: 'Oliwa truflowa', prots: 0 },
        { carbs: 0, fats: 0, kcal: 0, name: 'Woda', prots: 0 },
        { carbs: 17.5, fats: 0.1, kcal: 77, name: 'Ziemniaki', prots: 2.1 }
    ])
})

//testuje czy jest token i czy jest poprawny tylko dla GET / bo w innych routach odpala sie ta sama funkcja
describe('Products routes without user (testing authenticate function)', () => {

    describe('GET /', () => {

        it("It should return 401 when cookie with JWT is not defined", async () => {
            const res = await request(app)
            .post('/products')
            .send()
            
            expect(res.status).to.eq(401)
        })

        it("It should return 403 when token is invalid", async () => {
            const res = await request(app)
            .post('/products')
            .set('Cookie', 'JWT=not.valid.token')
            .send()
        
            expect(res.status).to.eq(403)
        })
    })

})

describe('Products routes with role: user', () => {

    let accessToken

    before(async () => {
        let testUser = new User({
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
    })

    describe('GET /', () => {
        it("It should return 400 when name is not provided or is too short", async () => {
            const res = await request(app)
            .get('/products')
            .set('Cookie', `JWT=${accessToken}`)
            .send()
            
            expect(res.status).to.eq(400)
        })
    })

    describe('GET /?name=oliwa', () => {
        it("It should return two products with summary", async () => {
            const res = await request(app)
            .get('/products?name=oliwa')
            .set('Cookie', `JWT=${accessToken}`)
            .send()
            
            expect(res.status).to.eq(200)
            expect(res.body.length).to.eq(2)
            expect(res.body[0].name).to.eq('Oliwa z oliwek')
            expect(res.body[0].kcal).to.eq(884)
            expect(res.body[0].fats).to.eq(100)
            expect(res.body[0].carbs).to.eq(4)
            expect(res.body[0].prots).to.eq(0)
            expect(res.body[1].name).to.eq('Oliwa truflowa')
            expect(res.body[1].kcal).to.eq(828)
            expect(res.body[1].fats).to.eq(92)
            expect(res.body[1].carbs).to.eq(0)
            expect(res.body[1].prots).to.eq(0)
        })

    })

    describe('GET /:id', () => {
        it("It should be 404 when id is not valid", async () => {
            const res = await request(app)
            .get('/products/test')
            .set('Cookie', `JWT=${accessToken}`)
            .send()
            
            expect(res.status).to.eq(404)
        })
        
        it("It should be 404 when there is not such product", async () => {
            const res = await request(app)
            .get('/products/60b66b09fd598412d038bec8')
            .set('Cookie', `JWT=${accessToken}`)
            .set('Content-type', 'application/json')
            .send()
            
            expect(res.status).to.eq(404)
        })

        it("It should return product when id is ok", async () => {
            const res = await request(app)
            .get('/products/'+mockedProducts[0].id)
            .set('Cookie', `JWT=${accessToken}`)
            .send()
            
            expect(res.status).to.eq(200)
            expect(res.body).to.be.an('object').to.have.all.keys('_id', 'name', 'kcal', 'carbs', 'prots', 'fats')
        })
    })

    after(async () => {
        await User.remove({})
        await Token.remove({})
    })

})

describe('Products routes with role: admin', () => {
    let accessToken

    let createdObjectId

    before(async () => {
        let testUser = new User({
            username: 'fake',
            email: 'fake@test',
            role: 'admin'
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
    })

    describe('POST /', () => {
        it("It should be 400 without body", async () => {
            const res = await request(app)
            .post('/products')
            .set('Cookie', `JWT=${accessToken}`)
            .send()
            
            expect(res.status).to.eq(400)
        })
        
        it("It should be return new object when all params provided", async () => {
            const res = await request(app)
            .post('/products')
            .set('Cookie', `JWT=${accessToken}`)
            .send({
                "name": "test",
                "kcal": 10,
                "prots": 10,
                "carbs": 10,
                "fats": 10
            })
            
            expect(res.status).to.eq(200)
            expect(res.body).to.be.an('object').to.include.all.keys('_id', 'name', 'kcal', 'carbs', 'prots', 'fats')
            createdObjectId = res.body._id
        })
    })

    describe('PATCH /:id', () => {
        it("It should be 404 when id is not valid", async () => {
            const res = await request(app)
            .patch('/products/test')
            .set('Cookie', `JWT=${accessToken}`)
            .send()
            
            expect(res.status).to.eq(404)
        })
        
        it("It should be 404 when there is not such product or nothing provided", async () => {
            const res = await request(app)
            .patch('/products/60b66b09fd598412d038bec8')
            .set('Cookie', `JWT=${accessToken}`)
            .set('Content-type', 'application/json')
            .send({
                kcal: 200
            })
            
            expect(res.status).to.eq(404)
        })
        
        it("It should return updated object", async () => {
            const res = await request(app)
            .patch('/products/'+createdObjectId)
            .set('Cookie', `JWT=${accessToken}`)
            .send({
                "name": "test2",
                "kcal": 101
            })
            
            expect(res.status).to.eq(200)
            expect(res.body).to.be.an('object').to.include.all.keys('_id', 'name', 'kcal', 'carbs', 'prots', 'fats')
            expect(res.body.kcal).to.be.eq(101)
            expect(res.body.name).to.be.eq('test2')
        })
    })

    describe('DELETE /:id', () => {
        it("It should be 404 when id is not valid", async () => {
            const res = await request(app)
            .delete('/products/test')
            .set('Cookie', `JWT=${accessToken}`)
            .send()
            
            expect(res.status).to.eq(404)
        })
        
        it("It should be 404 when there is not such product", async () => {
            const res = await request(app)
            .delete('/products/60b66b09fd598412d038bec8')
            .set('Cookie', `JWT=${accessToken}`)
            .set('Content-type', 'application/json')
            .send()
            
            expect(res.status).to.eq(404)
        })
        
        it("It should return deleted object", async () => {
            const res = await request(app)
            .delete('/products/'+createdObjectId)
            .set('Cookie', `JWT=${accessToken}`)
            .send({
                "name": "test",
                "kcal": 10,
                "prots": 10,
                "carbs": 10,
                "fats": 10
            })
            
            expect(res.status).to.eq(200)
            expect(res.body).to.be.an('object').to.include.all.keys('_id', 'name', 'kcal', 'carbs', 'prots', 'fats')
        })
    })

    after(async () => {
        await User.remove({})
        await Token.remove({})
    })
})

after(async () => {
    await Product.remove({})
})

})