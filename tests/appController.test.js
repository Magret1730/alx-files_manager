/* eslint-disable */

import { expect } from 'chai';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

chai.use(chaiHttp);

const app = express();
app.get('/status', getStatus);
app.get('/stats', getStats);

describe('Status and Stats Routes', () => {
  let redisClientStub;
  let dbClientStub;

  beforeEach(() => {
    // Stubbing redisClient methods
    redisClientStub = sinon.stub(redisClient, 'isAlive');

    // Stubbing dbClient methods
    dbClientStub = sinon.stub(dbClient, 'isAlive');
    sinon.stub(dbClient, 'nbUsers').resolves(100);
    sinon.stub(dbClient, 'nbFiles').resolves(200);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('GET /status', () => {
    it('should return status of redis and db', async () => {
      redisClientStub.resolves(true); // Simulate Redis is alive
      dbClientStub.resolves(true); // Simulate DB is alive

      const res = await chai.request(app).get('/status');
      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal({
        redis: true,
        db: true,
      });
    });

    it('should return 500 if there is an error', async () => {
      redisClientStub.rejects(new Error('Redis error'));
      dbClientStub.rejects(new Error('DB error'));

      const res = await chai.request(app).get('/status');
      expect(res).to.have.status(500);
      expect(res.body).to.deep.equal({ error: 'Internal Server Error' });
    });
  });

  describe('GET /stats', () => {
    it('should return user and file counts', async () => {
      const res = await chai.request(app).get('/stats');
      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal({
        users: 100,
        files: 200,
      });
    });

    it('should return 500 if there is an error', async () => {
      dbClient.nbUsers.rejects(new Error('Failed to get users count'));
      dbClient.nbFiles.rejects(new Error('Failed to get files count'));

      const res = await chai.request(app).get('/stats');
      expect(res).to.have.status(500);
      expect(res.body).to.deep.equal({ error: 'Internal Server Error' });
    });
  });
});

