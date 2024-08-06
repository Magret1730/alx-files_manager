// /* eslint-disable */

// import chai from 'chai';
// import chaiHttp from 'chai-http';
// import sinon from 'sinon';
// import { expect } from 'chai';
// import { ObjectId } from 'mongodb';
// import app from '../server'; // Import your Express app
// import redisClient from '../utils/redis';
// import dbClient from '../utils/db';
// import FilesController from '../controllers/FilesController';

// chai.use(chaiHttp);

// describe('FilesController', () => {
//   let sandbox;

//   beforeEach(() => {
//     sandbox = sinon.createSandbox();
//   });

//   afterEach(() => {
//     sandbox.restore();
//   });

//   describe('POST /files/upload', () => {
//     it('should upload a file successfully', async () => {
//       const req = {
//         body: {
//           name: 'testfile.txt',
//           type: 'file',
//           parentId: '0',
//           isPublic: false,
//           data: 'SGVsbG8gd29ybGQ=' // base64 encoded "Hello world"
//         },
//         headers: {
//           'x-token': 'valid-token'
//         }
//       };

//       const userId = new ObjectId();
//       const fileId = new ObjectId();

//       sandbox.stub(redisClient, 'getAsync').resolves(userId.toString());
//       sandbox.stub(dbClient.client.db(dbClient.databaseName).collection('files'), 'insertOne').resolves({ insertedId: fileId });
//       sandbox.stub(fs.promises, 'writeFile').resolves();

//       const res = await chai.request(app)
//         .post('/files/upload')
//         .send(req.body)
//         .set(req.headers);

//       expect(res).to.have.status(201);
//       expect(res.body).to.have.property('id').eql(fileId);
//     });

//     it('should return 401 if token is missing', async () => {
//       const req = {
//         body: {
//           name: 'testfile.txt',
//           type: 'file',
//           parentId: '0',
//           isPublic: false,
//           data: 'SGVsbG8gd29ybGQ='
//         },
//         headers: {}
//       };

//       const res = await chai.request(app)
//         .post('/files/upload')
//         .send(req.body)
//         .set(req.headers);

//       expect(res).to.have.status(401);
//       expect(res.body).to.have.property('error').eql('Unauthorized');
//     });

//     // Add more tests to cover other scenarios like missing name, type, data, etc.
//   });

//   describe('GET /files/:id', () => {
//     it('should return file details', async () => {
//       const req = {
//         params: { id: new ObjectId().toString() },
//         headers: { 'x-token': 'valid-token' }
//       };

//       const userId = new ObjectId();
//       const fileId = new ObjectId();
//       const fileDocument = {
//         _id: fileId,
//         userId,
//         name: 'testfile.txt',
//         type: 'file',
//         isPublic: true
//       };

//       sandbox.stub(redisClient, 'getAsync').resolves(userId.toString());
//       sandbox.stub(dbClient.client.db(dbClient.databaseName).collection('files'), 'findOne').resolves(fileDocument);

//       const res = await chai.request(app)
//         .get(`/files/${req.params.id}`)
//         .set(req.headers);

//       expect(res).to.have.status(200);
//       expect(res.body).to.deep.equal(fileDocument);
//     });

//     it('should return 404 if file is not found', async () => {
//       const req = {
//         params: { id: new ObjectId().toString() },
//         headers: { 'x-token': 'valid-token' }
//       };

//       const userId = new ObjectId();

//       sandbox.stub(redisClient, 'getAsync').resolves(userId.toString());
//       sandbox.stub(dbClient.client.db(dbClient.databaseName).collection('files'), 'findOne').resolves(null);

//       const res = await chai.request(app)
//         .get(`/files/${req.params.id}`)
//         .set(req.headers);

//       expect(res).to.have.status(404);
//       expect(res.body).to.have.property('error').eql('Not Found');
//     });

//     // Add more tests for unauthorized access, etc.
//   });

//   // Add tests for `putPublish`, `putUnpublish`, and `getFile` methods similarly
// });
