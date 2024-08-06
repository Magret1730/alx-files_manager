/* eslint-disable */

import { expect } from 'chai';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import express from 'express';
import bodyParser from 'body-parser';
import UsersController from '../controllers/UsersController';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

chai.use(chaiHttp);

const app = express();
app.use(bodyParser.json());
app.post('/users', UsersController.postNew);
app.get('/users/me', UsersController.getMe);

describe('UsersController', () => {
//   let redisClientStub;
//   let dbClientStub;
  let insertOneStub;
  let findOneStub;
  let getAsyncStub;

  beforeEach(() => {
    // Stubbing redisClient methods
    getAsyncStub = sinon.stub(redisClient, 'getAsync');

    // Stubbing dbClient methods
    insertOneStub = sinon.stub(dbClient.client.db(dbClient.databaseName).collection('users'), 'insertOne');
    findOneStub = sinon.stub(dbClient.client.db(dbClient.databaseName).collection('users'), 'findOne');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('POST /users', () => {
    it('should return 400 if email is missing', async () => {
      const res = await chai.request(app).post('/users').send({ password: 'password123' });
      expect(res).to.have.status(400);
      expect(res.body).to.deep.equal({ error: 'Missing email' });
    });

    it('should return 400 if password is missing', async () => {
      const res = await chai.request(app).post('/users').send({ email: 'test@example.com' });
      expect(res).to.have.status(400);
      expect(res.body).to.deep.equal({ error: 'Missing password' });
    });

    // it('should return 400 if user already exists', async () => {
    //   findOneStub.resolves({ email: 'test@example.com' }); // Simulate existing user

    //   const res = await chai.request(app).post('/users').send({ email: 'test@example.com', password: 'password123' });
    //   expect(res).to.have.status(400);
    //   expect(res.body).to.deep.equal({ error: 'Already exist' });
    // });

    // it('should return 201 and the new user if successful', async () => {
    //   findOneStub.resolves(null); // Simulate no existing user
    //   insertOneStub.resolves({ insertedId: '123456' }); // Simulate successful insert

    //   const res = await chai.request(app).post('/users').send({ email: 'test@example.com', password: 'password123' });
    //   expect(res).to.have.status(201);
    //   expect(res.body).to.deep.equal({
    //     id: '123456',
    //     email: 'test@example.com',
    //   });
    // });

    // it('should return 500 if there is an error', async () => {
    //   findOneStub.rejects(new Error('Database error'));

    //   const res = await chai.request(app).post('/users').send({ email: 'test@example.com', password: 'password123' });
    //   expect(res).to.have.status(500);
    //   expect(res.body).to.deep.equal({ error: 'Database error' });
    // });
  });

  describe('GET /users/me', () => {
    it('should return 401 if token is missing', async () => {
      const res = await chai.request(app).get('/users/me');
      expect(res).to.have.status(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });

    it('should return 401 if token is invalid', async () => {
      getAsyncStub.resolves(null); // Simulate invalid token

      const res = await chai.request(app).get('/users/me').set('x-token', 'invalidToken');
      expect(res).to.have.status(401);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });

    // it('should return 201 with user info if token is valid', async () => {
    //   getAsyncStub.resolves('123456'); // Simulate valid token
    //   findOneStub.resolves({ _id: '123456', email: 'test@example.com' }); // Simulate existing user

    //   const res = await chai.request(app).get('/users/me').set('x-token', 'validToken');
    //   expect(res).to.have.status(201);
    //   expect(res.body).to.deep.equal({
    //     id: '123456',
    //     email: 'test@example.com',
    //   });
    // });

    it('should return 500 if there is an error', async () => {
      getAsyncStub.rejects(new Error('Redis error'));

      const res = await chai.request(app).get('/users/me').set('x-token', 'validToken');
      expect(res).to.have.status(500);
      expect(res.body).to.deep.equal({ error: 'Redis error' });
    });
  });
});
