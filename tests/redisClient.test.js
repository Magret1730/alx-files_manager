/* eslint-disable */

import { expect } from 'chai';
import sinon from 'sinon';
import redisClient from '../utils/redis';

describe('redisClient', () => {
  describe('#isAlive()', () => {
    it('should return true if client is connected', () => {
      redisClient.client.connected = true;
      expect(redisClient.isAlive()).to.be.true;
    });

    it('should return false if client is not connected', function() {
      redisClient.client.connected = false;
      expect(redisClient.isAlive()).to.be.false;
    });
  });

  describe('#get()', function() {
    it('should return the value for a given key', async function() {
      const key = 'testKey';
      const value = 'testValue';
      
      redisClient.getAsync = sinon.stub().resolves(value);
      
      const result = await redisClient.get(key);
      expect(result).to.equal(value);
    });

    it('should return an error message if getting the key fails', async function() {
      const key = 'testKey';
      const errorMessage = "Can't get testKey: Error";

      redisClient.getAsync = sinon.stub().rejects(new Error('Error'));
      
      const result = await redisClient.get(key);
      expect(result).to.equal(errorMessage);
    });
  });

  describe('#set()', function() {
    it('should set the value for a given key successfully', async function() {
      const key = 'testKey';
      const value = 'testValue';
      const duration = 60;
      const successMessage = `Key ${key} set successfully`;
      
      redisClient.setAsync = sinon.stub().resolves('OK');
      
      const result = await redisClient.set(key, value, duration);
      expect(result).to.equal(successMessage);
    });

    it('should return an error message if setting the key fails', async function() {
      const key = 'testKey';
      const value = 'testValue';
      const duration = 60;
      const errorMessage = `Can't set ${key} of value ${value}: Error`;

      redisClient.setAsync = sinon.stub().rejects(new Error('Error'));
      
      const result = await redisClient.set(key, value, duration);
      expect(result).to.equal(errorMessage);
    });
  });

  describe('#del()', function() {
    it('should delete the key successfully', async function() {
      const key = 'testKey';
      
      redisClient.delAsync = sinon.stub().resolves(1); // Redis returns 1 if key was deleted
      
      const result = await redisClient.del(key);
      expect(result).to.equal(1);
    });

    it('should return an error message if deleting the key fails', async function() {
      const key = 'testKey';
      const errorMessage = `Can't delete ${key}: Error`;

      redisClient.delAsync = sinon.stub().rejects(new Error('Error'));
      
      const result = await redisClient.del(key);
      expect(result).to.equal(errorMessage);
    });
  });
});
