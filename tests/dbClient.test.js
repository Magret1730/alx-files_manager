/* eslint-disable */

import { expect } from 'chai';
import sinon from 'sinon';
import { MongoClient } from 'mongodb';
import dbClient from '../utils/db';

describe('DBClient', () => {
//   let dbClient;
  let mongoClientStub;
  let dbStub;

  beforeEach(() => {
    // Stub MongoClient and other MongoDB methods
    mongoClientStub = sinon.stub(MongoClient.prototype, 'connect').resolves();
    dbStub = sinon.createStubInstance(MongoClient.prototype.db);
    sinon.stub(MongoClient.prototype, 'db').returns(dbStub);
    
    // dbClient = new DBClient();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('#connect()', () => {
    it('should connect to MongoDB successfully', async () => {
      mongoClientStub.resolves(); // Ensure the connection resolves

      const result = await dbClient.connect();
      expect(result).to.be.true;
      expect(dbClient.isConnected).to.be.true;
    });

    it('should fail to connect to MongoDB', async () => {
      mongoClientStub.rejects(new Error('Connection failed')); // Ensure the connection rejects

      const result = await dbClient.connect();
      expect(result).to.be.false;
      expect(dbClient.isConnected).to.be.false;
    });
  });

  describe('#isAlive()', () => {
    it('should return true if client is connected', () => {
      sinon.stub(dbClient.client.topology, 'isConnected').returns(true);
      expect(dbClient.isAlive()).to.be.true;
    });

    it('should return false if client is not connected', () => {
      sinon.stub(dbClient.client.topology, 'isConnected').returns(false);
      expect(dbClient.isAlive()).to.be.false;
    });
  });

//   describe('#nbUsers()', () => {
//     it('should return the number of users', async () => {
//       dbStub.collection.returns({
//         countDocuments: sinon.stub().resolves(5)
//       });

//       const count = await dbClient.nbUsers();
//       expect(count).to.equal(5);
//     });

//     it('should return 0 if an error occurs', async () => {
//       dbStub.collection.throws(new Error('Failed to count documents'));

//       const count = await dbClient.nbUsers();
//       expect(count).to.equal(0);
//     });
//   });

//   describe('#nbFiles()', () => {
//     it('should return the number of files', async () => {
//       dbStub.collection.returns({
//         countDocuments: sinon.stub().resolves(10)
//       });

//       const count = await dbClient.nbFiles();
//       expect(count).to.equal(10);
//     });

//     it('should return 0 if an error occurs', async () => {
//       dbStub.collection.throws(new Error('Failed to count documents'));

//       const count = await dbClient.nbFiles();
//       expect(count).to.equal(0);
//     });
//   });

  describe('#close()', () => {
    it('should close the MongoDB connection successfully', async () => {
      sinon.stub(dbClient.client, 'close').resolves();
      await dbClient.close();
      expect(dbClient.client.close.calledOnce).to.be.true;
    });

    it('should handle errors when closing the MongoDB connection', async () => {
      sinon.stub(dbClient.client, 'close').rejects(new Error('Disconnect failed'));
      await dbClient.close();
      expect(dbClient.client.close.calledOnce).to.be.true;
    });
  });
});
